
const API_BASE_URL = 'http://localhost:3000'

export interface AuthUser {
    id: number
    first_name: string
    last_name: string
    email: string
}

interface LoginResponse {
    token: string
    user: AuthUser
}

export async function login(
    email: string,
    password: string,
): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Login failed')
    }

    return data as LoginResponse
}

export interface Employee {
    id: number
    employee_number: string
    first_name: string
    last_name: string
    email: string
    department: string
    employment_status: string
    country: {
        id: number
        name: string
        code: string
    }
}

export interface EmployeesResponse {
    employees: Employee[]
    pagination: {
        page: number
        per_page: number
        total: number
        total_pages: number
    }
}

export interface EmployeeQuery {
    page: number
    perPage?: number
    search?: string
    department?: string
    employmentStatus?: string
    countryId?: number
}

export async function fetchEmployees(
    token: string,
    query: EmployeeQuery,
): Promise<EmployeesResponse> {
    const params = new URLSearchParams({
        page: String(query.page),
        per_page: String(query.perPage ?? 25),
    })

    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.department) params.set('department', query.department)
    if (query.employmentStatus) params.set('employment_status', query.employmentStatus)
    if (query.countryId) params.set('country_id', String(query.countryId))

    const response = await fetch(
        `${API_BASE_URL}/api/v1/employees?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees')
    }

    return data as EmployeesResponse
}

export interface DashboardStatistics {
    total_employees: number
    active_employees: number
    total_departments: number
    total_countries: number
}

interface DashboardStatisticsResponse {
    statistics: DashboardStatistics
}

export async function fetchDashboardStatistics(
    token: string,
): Promise<DashboardStatistics> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/dashboard/statistics`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard statistics')
    }

    return (data as DashboardStatisticsResponse).statistics
}

export interface SalaryRecord {
    id: number
    employee_id: number
    amount: number
    currency: string
    effective_from: string
    reason: string
    created_by_id: number
    updated_by_id: number | null
    employee: {
        id: number
        employee_number: string
        first_name: string
        last_name: string
        department: string
        country: {
            name: string
            code: string
        }
    }
}

export interface SalaryRecordsResponse {
    salary_records: SalaryRecord[]
    pagination: {
        page: number
        per_page: number
        total: number
        total_pages: number
    }
}

export interface SalaryRecordsQuery {
    page: number
    perPage?: number
    search?: string
}

export async function fetchSalaryRecords(
    token: string,
    query: SalaryRecordsQuery,
): Promise<SalaryRecordsResponse> {
    const params = new URLSearchParams({
        page: String(query.page),
        per_page: String(query.perPage ?? 25),
    })

    if (query.search?.trim()) {
        params.set('search', query.search.trim())
    }

    const response = await fetch(
        `${API_BASE_URL}/api/v1/salary_records?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch salary records')
    }

    return data as SalaryRecordsResponse
}
