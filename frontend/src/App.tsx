
import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import {
  fetchEmployees,
  login,
  type AuthUser,
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
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [employeeError, setEmployeeError] = useState('')

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

  useEffect(() => {
    localStorage.setItem('acme-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!authToken) return

    let cancelled = false

    async function loadEmployees() {
      setIsLoadingEmployees(true)
      setEmployeeError('')

      try {
        const result = await fetchEmployees(authToken!)

        if (!cancelled) {
          setEmployees(result.employees)
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
    }

    void loadEmployees()

    return () => {
      cancelled = true
    }
  }, [authToken])

  const departments = Array.from(
    new Set(employees.map((employee) => employee.department)),
  ).sort()

  const statuses = Array.from(
    new Set(employees.map((employee) => employee.employment_status)),
  ).sort()

  const filteredEmployees = employees.filter((employee) => {
    const query = search.trim().toLowerCase()
    const fullName = `${employee.first_name} ${employee.last_name}`

    const matchesSearch =
      fullName.toLowerCase().includes(query) ||
      employee.employee_number.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query)

    const matchesDepartment =
      !departmentFilter || employee.department === departmentFilter

    const matchesStatus =
      !statusFilter || employee.employment_status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const totalEmployees = employees.length

  const activeEmployees = employees.filter(
    (employee) => employee.employment_status.toLowerCase() === 'active',
  ).length

  const totalDepartments = departments.length

  const totalCountries = new Set(
    employees.map((employee) => employee.country.name),
  ).size

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
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
    setEmployeeError('')
    setSearch('')
    setDepartmentFilter('')
    setStatusFilter('')
    setLoginError('')
    setPassword('')
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
                onClick={() => {
                  setEmployeeError('')
                  setAuthToken((current) => current)
                }}
              >
                Dismiss error
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
                {isLoadingEmployees ? '…' : totalEmployees}
              </div>
              <div className="stat-foot">Returned by the employee API</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Active employees</span>
                <span className="stat-icon icon-green">✓</span>
              </div>
              <div className="stat-value">
                {isLoadingEmployees ? '…' : activeEmployees}
              </div>
              <div className="stat-foot">
                {totalEmployees === 0
                  ? 'No employee data yet'
                  : `${((activeEmployees / totalEmployees) * 100).toFixed(1)}% of returned employees`}
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Departments</span>
                <span className="stat-icon icon-orange">▦</span>
              </div>
              <div className="stat-value">{totalDepartments}</div>
              <div className="stat-foot">Distinct departments</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Countries</span>
                <span className="stat-icon icon-blue">◎</span>
              </div>
              <div className="stat-value">{totalCountries}</div>
              <div className="stat-foot">Countries represented</div>
            </article>
          </section>

          <section className="directory-section">
            <div className="directory-heading">
              <div>
                <h2>All employees</h2>
                <p>Search and manage your employee directory.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.print()}
              >
                ↓ Export
              </button>
            </div>

            <div className="table-toolbar">
              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search by name, ID or email..."
                  aria-label="Search employees"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <select
                aria-label="Filter by department"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
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
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
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
                Showing <strong>{filteredEmployees.length}</strong> of{' '}
                <strong>{totalEmployees}</strong> employees returned by the API
              </span>
            </footer>
          </section>

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
