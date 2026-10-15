
import { useEffect, useState } from 'react'
import './App.css'
import {
  fetchDashboardStatistics,
  fetchEmployees,
  fetchEmployeeDetails,
  fetchSalaryRecords,
  createSalaryRecord,
  login,
  type AuthUser,
  type DashboardStatistics,
  type Employee,
  type EmployeeDetailsResponse,
  type SalaryRecord,
} from './api'

const navigation = [
  { icon: '▦', label: 'Overview' },
  { icon: '♙', label: 'Employees' },
  { icon: '▤', label: 'Salary records' },
  { icon: '▥', label: 'Analytics' },
]

type Page = 'Overview' | 'Employees' | 'Salary records' | 'Analytics'

function formatStatus(status: string) {
  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function App() {
  const [activePage, setActivePage] = useState<Page>('Employees')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetailsResponse | null>(null)
  const [isLoadingEmployeeDetails, setIsLoadingEmployeeDetails] = useState(false)
  const [employeeDetailsError, setEmployeeDetailsError] = useState('')
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [salaryPagination, setSalaryPagination] = useState({
    page: 1,
    per_page: 25,
    total: 0,
    total_pages: 0,
  })
  const [salaryPage, setSalaryPage] = useState(1)
  const [salarySearch, setSalarySearch] = useState('')
  const [isLoadingSalaryRecords, setIsLoadingSalaryRecords] = useState(false)
  const [salaryRecordsError, setSalaryRecordsError] = useState('')

  const [salaryReloadKey, setSalaryReloadKey] = useState(0)
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editingSalaryRecord, setEditingSalaryRecord] = useState<SalaryRecord | null>(null)
  const [salaryEmployeeId, setSalaryEmployeeId] = useState('')
  const [salaryEmployeeOptions, setSalaryEmployeeOptions] = useState<Employee[]>([])
  const [salaryEmployeeSearch, setSalaryEmployeeSearch] = useState('')
  const [isLoadingSalaryEmployees, setIsLoadingSalaryEmployees] = useState(false)
  const [salaryAmount, setSalaryAmount] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('USD')
  const [salaryEffectiveFrom, setSalaryEffectiveFrom] = useState('')
  const [salaryReason, setSalaryReason] = useState('')
  const [salaryFormError, setSalaryFormError] = useState('')
  const [salaryFormSuccess, setSalaryFormSuccess] = useState('')
  const [isSavingSalary, setIsSavingSalary] = useState(false)

  const [employeePagination, setEmployeePagination] = useState({

    page: 1,
    per_page: 25,
    total: 0,
    total_pages: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [employeeError, setEmployeeError] = useState('')
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null)
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false)
  const [statisticsError, setStatisticsError] = useState('')

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('acme-theme')

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageInput, setPageInput] = useState('1')
  const [countryFilter, setCountryFilter] = useState('')

  useEffect(() => {
    localStorage.setItem('acme-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!authToken) return

    let cancelled = false

    // Debounce search so we don't send an API request for every keystroke.
    const timeoutId = window.setTimeout(async () => {
      if (cancelled) return

      setIsLoadingEmployees(true)
      setEmployeeError('')

      try {
        const result = await fetchEmployees(authToken, {
          page: currentPage,
          perPage: 25,
          search,
          department: departmentFilter,
          employmentStatus: statusFilter,
          countryId: countryFilter ? Number(countryFilter) : undefined,
        })

        if (!cancelled) {
          setEmployees(result.employees)
          setEmployeePagination(result.pagination)
        }
      } catch (error) {
        if (!cancelled) {
          setEmployeeError(
            error instanceof Error
              ? error.message
              : 'Failed to load employees',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEmployees(false)
        }
      }
    }, search.trim() ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [authToken, currentPage, search, departmentFilter, statusFilter, countryFilter])

  useEffect(() => {
    if (!authToken) return

    let cancelled = false

    async function loadStatistics() {
      setIsLoadingStatistics(true)
      setStatisticsError('')

      try {
        const result = await fetchDashboardStatistics(authToken!)

        if (!cancelled) {
          setStatistics(result)
        }
      } catch (error) {
        if (!cancelled) {
          setStatisticsError(
            error instanceof Error
              ? error.message
              : 'Failed to load dashboard statistics',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStatistics(false)
        }
      }
    }

    void loadStatistics()

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    if (!authToken || activePage !== 'Salary records') return

    let cancelled = false

    const timeoutId = window.setTimeout(async () => {
      setIsLoadingSalaryRecords(true)
      setSalaryRecordsError('')

      try {
        const result = await fetchSalaryRecords(authToken, {
          page: salaryPage,
          perPage: 25,
          search: salarySearch,
        })

        if (!cancelled) {
          setSalaryRecords(result.salary_records)
          setSalaryPagination(result.pagination)
        }
      } catch (error) {
        if (!cancelled) {
          setSalaryRecordsError(
            error instanceof Error
              ? error.message
              : 'Failed to load salary records',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSalaryRecords(false)
        }
      }
    }, salarySearch.trim() ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [authToken, activePage, salaryPage, salarySearch, salaryReloadKey])

  useEffect(() => {
    if (!authToken || !showSalaryForm) return

    let cancelled = false

    const timeoutId = window.setTimeout(async () => {
      setIsLoadingSalaryEmployees(true)
      setSalaryFormError('')

      try {
        const result = await fetchEmployees(authToken, {
          page: 1,
          perPage: 100,
          search: salaryEmployeeSearch,
        })

        if (!cancelled) {
          setSalaryEmployeeOptions(result.employees)
        }
      } catch (error) {
        if (!cancelled) {
          setSalaryFormError(
            error instanceof Error ? error.message : 'Failed to load employees',
          )
        }
      } finally {
        if (!cancelled) setIsLoadingSalaryEmployees(false)
      }
    }, salaryEmployeeSearch.trim() ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [authToken, showSalaryForm, salaryEmployeeSearch])

  // These are the departments/statuses used by the current ACME seed data.
  // Filtering itself happens on the server across all employees, not just this page.
  const departments = [
    'Customer Support',
    'Engineering',
    'Finance',
    'Human Resources',
    'Marketing',
    'Operations',
    'Product',
    'Sales',
  ]

  const statuses = ['active', 'inactive']
  const filteredEmployees = employees

  const totalEmployees = statistics?.total_employees ?? 0
  const activeEmployees = statistics?.active_employees ?? 0
  const totalDepartments = statistics?.total_departments ?? 0
  const totalCountries = statistics?.total_countries ?? 0

  async function handleLogin(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const result = await login(email, password)
      setAuthToken(result.token)
      setAuthUser(result.user)
      setPassword('')
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Unable to log in',
      )
    } finally {
      setIsLoggingIn(false)
    }
  }


  async function handleCreateSalaryRecord(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setSalaryFormError('')
    setSalaryFormSuccess('')

    const employeeId = Number(salaryEmployeeId)
    const amount = Number(salaryAmount)

    if (
      !editingSalaryRecord &&
      (!Number.isInteger(employeeId) || employeeId < 1)
    ) {
      setSalaryFormError('Please select an employee from the list.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setSalaryFormError('Salary amount must be greater than zero.')
      return
    }

    setIsSavingSalary(true)

    try {
      const selectedEmployeeId = editingSalaryRecord
        ? editingSalaryRecord.employee_id
        : employeeId

      // If this employee already has salary history, reference their latest
      // scheduled record so the API can reject stale/out-of-order changes.
      let basedOnSalaryRecordId = editingSalaryRecord?.id

      if (!editingSalaryRecord) {
        const selectedEmployee = salaryEmployeeOptions.find(
          (employee) => employee.id === selectedEmployeeId,
        )

        if (!selectedEmployee) {
          setSalaryFormError('Please select an employee from the list.')
          return
        }

        const existingRecords = await fetchSalaryRecords(authToken!, {
          page: 1,
          perPage: 100,
          search: selectedEmployee.employee_number,
        })

        const latestRecord = existingRecords.salary_records.find(
          (record) =>
            record.employee_id === selectedEmployeeId &&
            record.is_latest_scheduled,
        )

        basedOnSalaryRecordId = latestRecord?.id
      }

      const input = {
        employee_id: selectedEmployeeId,
        amount,
        currency: salaryCurrency,
        effective_from: salaryEffectiveFrom,
        reason: salaryReason.trim(),
        ...(basedOnSalaryRecordId !== undefined
          ? { based_on_salary_record_id: basedOnSalaryRecordId }
          : {}),
      }

      await createSalaryRecord(authToken!, input)
      setSalaryFormSuccess(
        editingSalaryRecord
          ? 'Salary change scheduled successfully. Previous salary records were preserved.'
          : 'Salary record created successfully.',
      )

      setEditingSalaryRecord(null)
      setSalaryEmployeeId('')
      setSalaryEmployeeSearch('')
      setSalaryAmount('')
      setSalaryCurrency('USD')
      setSalaryEffectiveFrom('')
      setSalaryReason('')
      setSalaryPage(1)
      setSalaryReloadKey((key) => key + 1)
      setShowSalaryForm(false)
    } catch (error) {
      setSalaryFormError(
        error instanceof Error ? error.message : 'Failed to save salary record',
      )
    } finally {
      setIsSavingSalary(false)
    }
  }

  function handleEditSalaryRecord(record: SalaryRecord) {
    setEditingSalaryRecord(record)
    setSalaryEmployeeId(String(record.employee_id))
    setSalaryEmployeeSearch(
      `${record.employee.first_name} ${record.employee.last_name} ${record.employee.employee_number}`,
    )
    setSalaryAmount(String(record.amount))
    setSalaryCurrency(record.currency)
    setSalaryEffectiveFrom(record.effective_from)
    setSalaryReason(record.reason)
    setSalaryFormError('')
    setSalaryFormSuccess('')
    setShowSalaryForm(true)
  }

  async function handleOpenEmployeeDetails(employeeId: number) {
    setSelectedEmployeeId(employeeId)
    setEmployeeDetails(null)
    setEmployeeDetailsError('')
    setIsLoadingEmployeeDetails(true)

    try {
      const result = await fetchEmployeeDetails(authToken!, employeeId)
      setEmployeeDetails(result)
    } catch (error) {
      setEmployeeDetailsError(
        error instanceof Error ? error.message : 'Failed to load employee details',
      )
    } finally {
      setIsLoadingEmployeeDetails(false)
    }
  }

  function handleCloseEmployeeDetails() {
    setSelectedEmployeeId(null)
    setEmployeeDetails(null)
    setEmployeeDetailsError('')
    setIsLoadingEmployeeDetails(false)
  }

  function handleLogout() {
    setAuthToken(null)
    setAuthUser(null)
    handleCloseEmployeeDetails()
    setEmployees([])
    setEmployeePagination({ page: 1, per_page: 25, total: 0, total_pages: 0 })
    setCurrentPage(1)
    setStatistics(null)
    setStatisticsError('')
    setEmployeeError('')
    setSearch('')
    setDepartmentFilter('')
    setStatusFilter('')
    setLoginError('')
    setPassword('')
  }

  function goToPage(page: number) {
    const lastPage = employeePagination.total_pages

    if (lastPage === 0 || !Number.isInteger(page)) return
    if (page < 1 || page > lastPage) return

    setCurrentPage(page)
    setPageInput(String(page))
  }

  function handlePageJump() {
    const page = Number(pageInput)

    if (
      pageInput.trim() === '' ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > employeePagination.total_pages
    ) {
      return
    }

    goToPage(page)
  }

  if (!authToken || !authUser) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>ACME Salary Management</h1>
          <p>Sign in to your HR account</p>

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {loginError && <p role="alert">{loginError}</p>}

          <button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <span>
            acme<span className="brand-light"> people</span>
          </span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <a
              href="#"
              key={item.label}
              className={`nav-item ${activePage === item.label ? 'active' : ''}`}
              aria-current={activePage === item.label ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                setActivePage(item.label as Page)
                if (item.label === 'Employees') handleCloseEmployeeDetails()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.label === 'Employees' && (
                <span className="nav-count">{totalEmployees}</span>
              )}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Need a hand?</strong>
            <p>Contact your workspace administrator for help.</p>
          </div>

          <div className="profile">
            <div className="avatar avatar-purple">
              {authUser.first_name[0]}
              {authUser.last_name[0]}
            </div>
            <div className="profile-info">
              <strong>
                {authUser.first_name} {authUser.last_name}
              </strong>
              <span>{authUser.email}</span>
            </div>
            <button
              type="button"
              className="profile-menu"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span className="environment-label">CONNECTED TO API</span>

            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={() =>
                setTheme((current) =>
                  current === 'light' ? 'dark' : 'light',
                )
              }
            >
              {theme === 'light' ? '☾' : '☀'}
              <span>
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </span>
            </button>

            <div className="avatar avatar-blue">
              {authUser.first_name[0]}
              {authUser.last_name[0]}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Employees' ? (
            selectedEmployeeId !== null ? (
              <section className="employee-detail-view">
                <button
                  type="button"
                  className="secondary-button employee-detail-back"
                  onClick={handleCloseEmployeeDetails}
                >
                  ← Back to employees
                </button>

                {isLoadingEmployeeDetails && (
                  <div className="empty-state" role="status">Loading employee details…</div>
                )}

                {employeeDetailsError && (
                  <div className="empty-state" role="alert">
                    <p>Could not load employee details: {employeeDetailsError}</p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void handleOpenEmployeeDetails(selectedEmployeeId)}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {employeeDetails && (
                  <>
                    <section className="page-heading employee-detail-heading">
                      <div>
                        <div className="eyebrow">EMPLOYEE PROFILE</div>
                        <h1>{employeeDetails.employee.first_name} {employeeDetails.employee.last_name}</h1>
                        <p className="page-description">
                          {employeeDetails.employee.employee_number} · {employeeDetails.employee.email}
                        </p>
                      </div>
                      <span className={`status-pill ${employeeDetails.employee.employment_status.toLowerCase() === 'active' ? 'status-active' : 'status-leave'}`}>
                        <span className="status-dot"></span>
                        {formatStatus(employeeDetails.employee.employment_status)}
                      </span>
                    </section>

                    <div className="employee-detail-grid">
                      <section className="detail-card">
                        <span className="detail-label">DEPARTMENT</span>
                        <strong>{employeeDetails.employee.department}</strong>
                      </section>
                      <section className="detail-card">
                        <span className="detail-label">COUNTRY</span>
                        <strong>{employeeDetails.employee.country.name} ({employeeDetails.employee.country.code})</strong>
                      </section>
                      <section className="detail-card detail-current-salary">
                        <span className="detail-label">CURRENT ANNUAL SALARY</span>
                        {employeeDetails.current_salary ? (
                          <strong>
                            {employeeDetails.current_salary.currency}{' '}
                            {Number(employeeDetails.current_salary.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        ) : (
                          <strong>Not set</strong>
                        )}
                        {employeeDetails.current_salary && (
                          <span>Effective {employeeDetails.current_salary.effective_from}</span>
                        )}
                      </section>
                    </div>

                    <section className="employee-history-section">
                      <div className="section-heading-row">
                        <div>
                          <h2>Salary history</h2>
                          <p className="page-description">Previous salary records and scheduled changes, newest effective date first.</p>
                        </div>
                        <span className="history-count">{employeeDetails.salary_history.length} records</span>
                      </div>

                      {employeeDetails.salary_history.length === 0 ? (
                        <div className="empty-state">No salary records have been added for this employee.</div>
                      ) : (
                        <div className="table-scroll">
                          <table className="employee-table salary-history-table">
                            <thead>
                              <tr>
                                <th>STATUS</th>
                                <th>EFFECTIVE FROM</th>
                                <th>ANNUAL SALARY</th>
                                <th>REASON</th>
                                <th>RECORD ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {employeeDetails.salary_history.map((record) => {
                                const isFuture = record.effective_from > new Date().toISOString().slice(0, 10)
                                const isCurrent = employeeDetails.current_salary?.id === record.id
                                const label = isFuture ? 'Scheduled' : isCurrent ? 'Current' : 'Historical'
                                return (
                                  <tr key={record.id} className={isFuture ? 'future-salary-row' : undefined}>
                                    <td><span className={`history-status ${isFuture ? 'history-scheduled' : isCurrent ? 'history-current' : 'history-past'}`}>{label}</span></td>
                                    <td>{record.effective_from}</td>
                                    <td className="salary-cell">
                                      {record.currency}{' '}
                                      {Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td>{record.reason}</td>
                                    <td>#{record.id}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </>
                )}
              </section>
            ) : (
              <>
                <section className="page-heading">
                  <div>
                    <div className="eyebrow">PEOPLE MANAGEMENT</div>
                    <h1>Employees</h1>
                    <p className="page-description">
                      Manage your people, compensation and employee information.
                    </p>
                  </div>
                </section>


                {employeeError && (
                  <div role="alert" className="empty-state">
                    <p>Could not load employees: {employeeError}</p>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isLoadingEmployees}
                      onClick={async () => {
                        setEmployeeError('')
                        setIsLoadingEmployees(true)

                        try {
                          const result = await fetchEmployees(authToken, {
                            page: currentPage,
                            perPage: 25,
                            search,
                            department: departmentFilter,
                            employmentStatus: statusFilter,
                          })
                          setEmployees(result.employees)
                          setEmployeePagination(result.pagination)
                        } catch (error) {
                          setEmployeeError(
                            error instanceof Error
                              ? error.message
                              : 'Failed to load employees',
                          )
                        } finally {
                          setIsLoadingEmployees(false)
                        }
                      }}
                    >
                      {isLoadingEmployees ? 'Retrying…' : 'Retry employees'}
                    </button>
                  </div>
                )}


                {statisticsError && (
                  <div role="alert" className="empty-state">
                    <p>Could not load dashboard statistics: {statisticsError}</p>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isLoadingStatistics}
                      onClick={async () => {
                        setStatisticsError('')
                        setIsLoadingStatistics(true)

                        try {
                          const result = await fetchDashboardStatistics(authToken)
                          setStatistics(result)
                        } catch (error) {
                          setStatisticsError(
                            error instanceof Error
                              ? error.message
                              : 'Failed to load dashboard statistics',
                          )
                        } finally {
                          setIsLoadingStatistics(false)
                        }
                      }}
                    >
                      {isLoadingStatistics ? 'Retrying…' : 'Retry statistics'}
                    </button>
                  </div>
                )}

                <section className="stats-grid">
                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Total employees</span>
                      <span className="stat-icon icon-indigo">♙</span>
                    </div>
                    <div className="stat-value">
                      {isLoadingStatistics ? '…' : totalEmployees}
                    </div>
                    <div className="stat-foot">Across the organization</div>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Active employees</span>
                      <span className="stat-icon icon-green">✓</span>
                    </div>
                    <div className="stat-value">
                      {isLoadingStatistics ? '…' : activeEmployees}
                    </div>
                    <div className="stat-foot">
                      {isLoadingStatistics
                        ? 'Loading statistics…'
                        : totalEmployees === 0
                          ? 'No employee data yet'
                          : `${((activeEmployees / totalEmployees) * 100).toFixed(1)}% of all employees`}
                    </div>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Active departments</span>
                      <span className="stat-icon icon-orange">▦</span>
                    </div>
                    <div className="stat-value">
                      {isLoadingStatistics ? '…' : totalDepartments}
                    </div>
                    <div className="stat-foot">
                      Distinct departments with active employees
                    </div>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Countries with active employees</span>
                      <span className="stat-icon icon-blue">◎</span>
                    </div>
                    <div className="stat-value">
                      {isLoadingStatistics ? '…' : totalCountries}
                    </div>
                    <div className="stat-foot">
                      Distinct countries with active employees
                    </div>
                  </article>
                </section>

                <div className="directory-heading">
                  <div>
                    <h2>All employees</h2>
                    <p>Search and manage your employee directory.</p>
                  </div>

                  <div className="directory-actions">
                    <form
                      className="top-pagination"
                      onSubmit={(event) => {
                        event.preventDefault()
                        handlePageJump()
                      }}
                    >
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={isLoadingEmployees || currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}
                        aria-label="Previous page"
                      >
                        ←
                      </button>

                      <label className="page-jump-label">
                        Page
                        <input
                          className="page-jump-input"
                          type="number"
                          min={1}
                          max={employeePagination.total_pages}
                          value={pageInput}
                          onChange={(event) => setPageInput(event.target.value)}
                          aria-label="Go to page number"
                        />
                        of {employeePagination.total_pages}
                      </label>

                      <button
                        type="submit"
                        className="secondary-button"
                        disabled={isLoadingEmployees || employeePagination.total_pages === 0}
                      >
                        Go
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        disabled={
                          isLoadingEmployees ||
                          currentPage >= employeePagination.total_pages
                        }
                        onClick={() => goToPage(currentPage + 1)}
                        aria-label="Next page"
                      >
                        →
                      </button>
                    </form>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => window.print()}
                    >
                      ↓ Export
                    </button>
                  </div>
                </div>


                <div className="table-toolbar">
                  <label className="search-box">
                    <span>⌕</span>
                    <input
                      type="search"
                      placeholder="Search by name, ID or email..."
                      aria-label="Search employees"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setCurrentPage(1)
                        setPageInput('1')
                      }}
                    />
                  </label>

                  <select
                    aria-label="Filter by department"
                    value={departmentFilter}
                    onChange={(event) => {
                      setDepartmentFilter(event.target.value)
                      setCurrentPage(1)
                      setPageInput('1')
                    }}
                  >
                    <option value="">All departments</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value)
                      setCurrentPage(1)
                      setPageInput('1')
                    }}
                  >
                    <option value="">All statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by country"
                    value={countryFilter}
                    onChange={(event) => {
                      setCountryFilter(event.target.value)
                      setCurrentPage(1)
                      setPageInput('1')
                    }}
                  >
                    <option value="">All countries</option>
                    <option value="1">United States</option>
                    <option value="2">India</option>
                    <option value="3">United Kingdom</option>
                    <option value="4">Germany</option>
                    <option value="5">Canada</option>
                    <option value="6">Australia</option>
                    <option value="7">Singapore</option>
                    <option value="8">Netherlands</option>
                  </select>
                </div>

                <div className="table-scroll">
                  <table className="employee-table">
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>DEPARTMENT</th>
                        <th>COUNTRY</th>
                        <th>STATUS</th>
                        <th>ANNUAL SALARY</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {isLoadingEmployees && (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            Loading employees…
                          </td>
                        </tr>
                      )}

                      {!isLoadingEmployees &&
                        !employeeError &&
                        filteredEmployees.map((employee, index) => {
                          const name = `${employee.first_name} ${employee.last_name}`
                          const isActive =
                            employee.employment_status.toLowerCase() === 'active'

                          return (
                            <tr key={employee.id}>
                              <td>
                                <div className="employee-cell">
                                  <div
                                    className={`avatar employee-avatar avatar-${index % 4}`}
                                  >
                                    {employee.first_name[0]}
                                    {employee.last_name[0]}
                                  </div>
                                  <div className="employee-info">
                                    <button
                                      type="button"
                                      className="employee-name-button"
                                      onClick={() => void handleOpenEmployeeDetails(employee.id)}
                                      aria-label={`View details for ${name}`}
                                    >
                                      {name}
                                    </button>
                                    <span>
                                      {employee.employee_number} · {employee.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>{employee.department}</td>
                              <td>{employee.country.name}</td>
                              <td>
                                <span
                                  className={`status-pill ${isActive ? 'status-active' : 'status-leave'}`}
                                >
                                  <span className="status-dot"></span>
                                  {formatStatus(employee.employment_status)}
                                </span>
                              </td>
                              <td className="salary-cell">
                                {employee.current_salary
                                  ? `${employee.current_salary.currency} ${Number(
                                    employee.current_salary.amount,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                  : '—'}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="row-menu"
                                  aria-label={`More options for ${name}`}
                                  title="Employee actions are not available yet"
                                  onClick={() =>
                                    window.alert(
                                      'Employee actions will be added in a later step.',
                                    )
                                  }
                                >
                                  ···
                                </button>
                              </td>
                            </tr>
                          )
                        })}

                      {!isLoadingEmployees &&
                        !employeeError &&
                        filteredEmployees.length === 0 && (
                          <tr>
                            <td colSpan={6} className="empty-state">
                              {employees.length === 0
                                ? 'No employees were returned by the API.'
                                : 'No employees match your search or filters.'}
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>

                <footer className="table-footer">
                  <span>
                    {employeePagination.total === 0 ? (
                      'Showing 0 of 0 matching employees'
                    ) : (
                      <>
                        Showing{' '}
                        <strong>
                          {(currentPage - 1) * employeePagination.per_page + 1}
                          {'–'}
                          {(currentPage - 1) * employeePagination.per_page + employees.length}
                        </strong>{' '}
                        of <strong>{employeePagination.total.toLocaleString()}</strong>{' '}
                        matching employees
                      </>
                    )}
                  </span>
                  <div className="pagination-controls" aria-label="Employee pagination">
                    <button
                      type="button"
                      className="secondary-button pagination-button"
                      disabled={isLoadingEmployees || currentPage <= 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      ← Previous
                    </button>
                    <span className="pagination-page">
                      Page <strong>{employeePagination.total_pages === 0 ? 0 : currentPage}</strong>{' '}
                      of <strong>{employeePagination.total_pages}</strong>
                    </span>
                    <button
                      type="button"
                      className="secondary-button pagination-button"
                      disabled={
                        isLoadingEmployees ||
                        employeePagination.total_pages === 0 ||
                        currentPage >= employeePagination.total_pages
                      }
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </footer>
              </>
            )
          ) : activePage === 'Salary records' ? (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">COMPENSATION MANAGEMENT</div>
                  <h1>Salary records</h1>
                  <p className="page-description">
                    Review salary changes and historical compensation records.
                  </p>
                </div>
              </section>


              <div className="directory-heading">
                <div>
                  <h2>All salary records</h2>
                  <p>
                    {salaryPagination.total.toLocaleString()} records across employees.
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSalaryFormError('')
                    setSalaryFormSuccess('')
                    setEditingSalaryRecord(null)
                    setShowSalaryForm((show) => !show)
                  }}
                >
                  {showSalaryForm ? 'Cancel' : '+ Add salary record'}
                </button>
              </div>

              {salaryFormSuccess && (
                <p role="status">{salaryFormSuccess}</p>
              )}

              {showSalaryForm && (
                <form
                  className="salary-form"
                  onSubmit={handleCreateSalaryRecord}
                >
                  <h2>{editingSalaryRecord ? 'Create salary change' : 'New salary record'}</h2>

                  {editingSalaryRecord ? (
                    <>
                      <label htmlFor="salary-employee-display">Employee</label>
                      <input
                        id="salary-employee-display"
                        type="text"
                        value={`${editingSalaryRecord.employee.first_name} ${editingSalaryRecord.employee.last_name} — ${editingSalaryRecord.employee.employee_number}`}
                        readOnly
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="salary-employee-search">Search employee</label>
                      <input
                        id="salary-employee-search"
                        type="search"
                        placeholder="Name or employee number"
                        value={salaryEmployeeSearch}
                        onChange={(event) => {
                          setSalaryEmployeeSearch(event.target.value)
                          setSalaryEmployeeId('')
                        }}
                      />

                      <label htmlFor="salary-employee-id">Select employee</label>
                      <select
                        id="salary-employee-id"
                        required
                        value={salaryEmployeeId}
                        onChange={(event) => setSalaryEmployeeId(event.target.value)}
                      >
                        <option value="">
                          {isLoadingSalaryEmployees ? 'Loading employees...' : 'Choose an employee'}
                        </option>

                        {salaryEmployeeOptions.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name} — {employee.employee_number}
                          </option>
                        ))}
                      </select>
                    </>
                  )}


                  <label htmlFor="salary-amount">Annual salary amount</label>
                  <input
                    id="salary-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={salaryAmount}
                    onChange={(event) => setSalaryAmount(event.target.value)}
                  />

                  <label htmlFor="salary-currency">Currency</label>
                  <select
                    id="salary-currency"
                    value={salaryCurrency}
                    onChange={(event) => setSalaryCurrency(event.target.value)}
                  >
                    {['USD', 'INR', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD', 'NZD'].map(
                      (currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ),
                    )}
                  </select>

                  <label htmlFor="salary-effective-from">Effective from</label>
                  <input
                    id="salary-effective-from"
                    type="date"
                    min={new Date().toLocaleDateString('en-CA')}
                    required
                    value={salaryEffectiveFrom}
                    onChange={(event) => setSalaryEffectiveFrom(event.target.value)}
                  />

                  <label htmlFor="salary-reason">Reason</label>
                  <input
                    id="salary-reason"
                    type="text"
                    required
                    maxLength={500}
                    value={salaryReason}
                    onChange={(event) => setSalaryReason(event.target.value)}
                  />

                  {salaryFormError && (
                    <p role="alert">{salaryFormError}</p>
                  )}

                  <button type="submit" disabled={isSavingSalary}>
                    {isSavingSalary
                      ? 'Saving…'
                      : editingSalaryRecord
                        ? 'Create salary change'
                        : 'Create salary record'}
                  </button>
                </form>
              )}

              <div className="table-toolbar">
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    type="search"
                    placeholder="Search employee, ID, email or department..."
                    aria-label="Search salary records"
                    value={salarySearch}
                    onChange={(event) => {
                      setSalarySearch(event.target.value)
                      setSalaryPage(1)
                    }}
                  />
                </label>
              </div>

              {salaryRecordsError && (
                <div role="alert" className="empty-state">
                  <p>Could not load salary records: {salaryRecordsError}</p>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isLoadingSalaryRecords}
                    onClick={() => {
                      setSalaryRecordsError('')
                      setSalaryReloadKey((key) => key + 1)
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="table-scroll">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>DEPARTMENT</th>
                      <th>COUNTRY</th>
                      <th>ANNUAL SALARY</th>
                      <th>EFFECTIVE FROM</th>
                      <th>REASON</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoadingSalaryRecords && (
                      <tr>
                        <td colSpan={7} className="empty-state">
                          Loading salary records…
                        </td>
                      </tr>
                    )}

                    {!isLoadingSalaryRecords &&
                      !salaryRecordsError &&
                      salaryRecords.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <div className="employee-info">
                              <strong>
                                {record.employee.first_name} {record.employee.last_name}
                              </strong>
                              <span>{record.employee.employee_number}</span>
                            </div>
                          </td>
                          <td>{record.employee.department}</td>
                          <td>{record.employee.country.name}</td>
                          <td className="salary-cell">
                            {record.currency}{' '}
                            {Number(record.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{record.effective_from}</td>
                          <td>{record.reason}</td>
                          <td>
                            {record.is_latest_scheduled && (
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => handleEditSalaryRecord(record)}
                              >
                                Create salary change
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                    {!isLoadingSalaryRecords &&
                      !salaryRecordsError &&
                      salaryRecords.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            No salary records match your search.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              <footer className="table-footer">
                <span>
                  Showing{' '}
                  <strong>{salaryRecords.length}</strong> of{' '}
                  <strong>{salaryPagination.total.toLocaleString()}</strong> salary records
                </span>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="secondary-button pagination-button"
                    disabled={isLoadingSalaryRecords || salaryPage <= 1}
                    onClick={() => setSalaryPage((page) => page - 1)}
                  >
                    ← Previous
                  </button>

                  <span className="pagination-page">
                    Page <strong>{salaryPagination.total_pages === 0 ? 0 : salaryPage}</strong>
                    {' '}of <strong>{salaryPagination.total_pages}</strong>
                  </span>

                  <button
                    type="button"
                    className="secondary-button pagination-button"
                    disabled={
                      isLoadingSalaryRecords ||
                      salaryPagination.total_pages === 0 ||
                      salaryPage >= salaryPagination.total_pages
                    }
                    onClick={() => setSalaryPage((page) => page + 1)}
                  >
                    Next →
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <section className="page-heading">
              <div>
                <div className="eyebrow">ACME PEOPLE MANAGEMENT</div>
                <h1>{activePage}</h1>
                <p className="page-description">
                  {activePage === 'Overview'
                    ? 'Organization overview and workforce statistics.'
                    : 'Salary distribution and compensation analytics will be available here.'}
                </p>
                <p>This section has not been implemented yet.</p>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <span>ACME People Management</span>
            <span>Salary information is confidential.</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
