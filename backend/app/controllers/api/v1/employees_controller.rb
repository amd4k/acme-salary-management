class Api::V1::EmployeesController < ApplicationController
  include Authenticatable

  def index
    page = params.fetch(:page, 1).to_i
    per_page = params.fetch(:per_page, 25).to_i

    if page < 1 || per_page < 1 || per_page > 100
      return render json: { error: "Invalid pagination parameters" }, status: :bad_request
    end

    employees = Employee.includes(:country)

    if params[:search].present?
      search = "%#{params[:search]}%"

      employees = employees.where(
        "employee_number ILIKE :search
         OR first_name ILIKE :search
         OR last_name ILIKE :search
         OR email ILIKE :search",
        search: search
      )
    end

    if params[:country_id].present?
      employees = employees.where(country_id: params[:country_id])
    end

    if params[:department].present?
      employees = employees.where(department: params[:department])
    end

    if params[:employment_status].present?
      employees = employees.where(employment_status: params[:employment_status])
    end

    total = employees.count
    total_pages = (total.to_f / per_page).ceil

    employees = employees
      .order(:employee_number)
      .limit(per_page)
      .offset((page - 1) * per_page)

    render json: {
      employees: employees.as_json(
        only: [
          :id,
          :employee_number,
          :first_name,
          :last_name,
          :email,
          :department,
          :employment_status
        ],
        include: {
          country: {
            only: [:id, :name, :code]
          }
        }
      ),
      pagination: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: total_pages
      }
    }
  end
  
  def show
    employee = Employee.includes(:country, :salary_records).find(params[:id])

    salary_history = employee.salary_records.order(effective_from: :desc)

    current_salary = employee.salary_records
      .where("effective_from <= ?", Date.current)
      .order(effective_from: :desc)
      .first

    render json: {
      employee: employee.as_json(
        only: [
          :id,
          :employee_number,
          :first_name,
          :last_name,
          :email,
          :department,
          :employment_status
        ],
        include: {
          country: {
            only: [:id, :name, :code]
          }
        }
      ),
      current_salary: current_salary&.as_json(
        only: [
          :id,
          :amount,
          :currency,
          :effective_from,
          :reason,
          :created_by_id
        ]
      ),
      salary_history: salary_history.as_json(
        only: [
          :id,
          :amount,
          :currency,
          :effective_from,
          :reason,
          :created_by_id
        ]
      )
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Employee not found" }, status: :not_found
  end
      
end
