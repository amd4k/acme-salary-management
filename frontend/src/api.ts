
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

interface EmployeesResponse {
    employees: Employee[]
    pagination: {
        page: number
        per_page: number
        total: number
        total_pages: number
    }
}

export async function fetchEmployees(
    token: string,
): Promise<EmployeesResponse> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/employees?per_page=25`,
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
