import { useEffect, useState } from 'react'
import './App.css'

const employees = [
  { id: 'ACM-1001', name: 'Olivia Rhye', email: 'olivia@acme.com', department: 'Engineering', country: 'United States', status: 'Active', salary: '$125,000' },
  { id: 'ACM-1002', name: 'Phoenix Baker', email: 'phoenix@acme.com', department: 'Product', country: 'United Kingdom', status: 'Active', salary: '$98,000' },
  { id: 'ACM-1003', name: 'Lana Steiner', email: 'lana@acme.com', department: 'Design', country: 'Germany', status: 'Active', salary: '$86,000' },
  { id: 'ACM-1004', name: 'Demi Wilkinson', email: 'demi@acme.com', department: 'Marketing', country: 'India', status: 'On leave', salary: '$72,000' },
  { id: 'ACM-1005', name: 'Candice Wu', email: 'candice@acme.com', department: 'Engineering', country: 'United States', status: 'Active', salary: '$118,000' },
  { id: 'ACM-1006', name: 'Natali Craig', email: 'natali@acme.com', department: 'Finance', country: 'India', status: 'Active', salary: '$64,000' },
]

const navigation = [
  { icon: '▦', label: 'Overview' },
  { icon: '♙', label: 'Employees' },
  { icon: '▤', label: 'Salary records' },
  { icon: '▥', label: 'Analytics' },
]

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('acme-theme')

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    localStorage.setItem('acme-theme', theme)
  }, [theme])

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredEmployees = employees.filter((employee) => {
    const query = search.trim().toLowerCase()

    const matchesSearch =
      employee.name.toLowerCase().includes(query) ||
      employee.id.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query)

    const matchesDepartment =
      !departmentFilter || employee.department === departmentFilter

    const matchesStatus =
      !statusFilter || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <span>acme<span className="brand-light"> people</span></span>
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
              {item.label === 'Employees' && <span className="nav-count">10k</span>}
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
            <div className="avatar avatar-purple">HR</div>
            <div className="profile-info">
              <strong>HR Manager</strong>
              <span>hr@acme.com</span>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span><span>/</span><strong>Employees</strong>
          </div>
          <div className="topbar-right">
            <span className="environment-label">DEMO DATA</span>

            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={() => setTheme((current) =>
                current === 'light' ? 'dark' : 'light'
              )}
            >
              {theme === 'light' ? '☾' : '☀'}
              <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
            </button>

            <button className="icon-button" aria-label="Notifications">♧</button>
            <div className="avatar avatar-blue">HR</div>
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
            <button className="primary-button" onClick={() => alert('Employee creation will be added in a later step.')}>
              <span>＋</span> Add employee
            </button>
          </section>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Total employees</span>
                <span className="stat-icon icon-indigo">♙</span>
              </div>
              <div className="stat-value">10,000</div>
              <div className="stat-foot">Across all countries</div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Active employees</span>
                <span className="stat-icon icon-green">✓</span>
              </div>
              <div className="stat-value">9,642</div>
              <div className="stat-foot"><span className="positive">96.4%</span> of total workforce</div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Departments</span>
                <span className="stat-icon icon-orange">▦</span>
              </div>
              <div className="stat-value">8</div>
              <div className="stat-foot">Across the organization</div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Countries</span>
                <span className="stat-icon icon-blue">◎</span>
              </div>
              <div className="stat-value">12</div>
              <div className="stat-foot">Global workforce</div>
            </article>
          </section>

          <section className="directory-section">
            <div className="directory-heading">
              <div>
                <h2>All employees</h2>
                <p>Search and manage your employee directory.</p>
              </div>
              <button className="secondary-button" onClick={() => window.print()}>
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
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </select>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="Active">Active</option>
                <option value="On leave">On leave</option>
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
                  {filteredEmployees.map((employee, index) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-cell">
                          <div className={`avatar employee-avatar avatar-${index % 4}`}>
                            {employee.name.split(' ').map((part) => part[0]).join('')}
                          </div>
                          <div className="employee-info">
                            <strong>{employee.name}</strong>
                            <span>{employee.id} · {employee.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{employee.department}</td>
                      <td>{employee.country}</td>
                      <td>
                        <span className={`status-pill ${employee.status === 'Active' ? 'status-active' : 'status-leave'}`}>
                          <span className="status-dot"></span>
                          {employee.status}
                        </span>
                      </td>
                      <td className="salary-cell">{employee.salary}</td>
                      <td><button className="row-menu" aria-label={`More options for ${employee.name}`}>···</button></td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No employees match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="table-footer">
              <span>Showing <strong>1–6</strong> of <strong>10,000</strong> employees</span>
              <div className="pagination">
                <button disabled>← Previous</button>
                <button className="page-number">1</button>
                <button>2</button>
                <button>3</button>
                <span>…</span>
                <button>1,667</button>
                <button>Next →</button>
              </div>
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
