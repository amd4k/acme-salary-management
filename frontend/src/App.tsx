
import { useEffect, useState } from 'react'
import './App.css'
import {
  fetchDashboardStatistics,
  fetchEmployees,
  login,
  type AuthUser,
  type DashboardStatistics,
  type Employee,
} from './api'

const navigation = [
  { icon: '▦', label: 'Overview' },
  { icon: '♙', label: 'Employees' },
  { icon: '▤', label: 'Salary records' },
  { icon: '▥', label: 'Analytics' },
]

function formatStatus(status: string) {
  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function App() {
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [employees, setEmployees] = useState<Employee[]>([])
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

  function handleLogout() {
    setAuthToken(null)
    setAuthUser(null)
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
              className={`nav-item ${item.label === 'Employees' ? 'active' : ''}`}
              onClick={(event) => event.preventDefault()}
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
            <strong>Employees</strong>
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
                              <strong>{name}</strong>
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
                        <td className="salary-cell">—</td>
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
        </div>

        <footer className="page-footer">
          <span>ACME People Management</span>
          <span>Salary information is confidential.</span>
        </footer>
      </main>
    </div>
  )
}

export default App
