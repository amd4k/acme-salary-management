
class Api::V1::EmployeesController < ApplicationController
  include Authenticatable

  def index
    page = params.fetch(:page, 1).to_i
    per_page = params.fetch(:per_page, 25).to_i

    if page < 1 || per_page < 1 || per_page > 100
      return render json: {
        error: "Invalid pagination parameters"
      }, status: :bad_request
    end

    employees = Employee.includes(:country)

    if params[:search].present?
      search = "%#{params[:search].strip}%"

      employees = employees.where(
        "employee_number ILIKE :search
        OR first_name ILIKE :search
        OR last_name ILIKE :search
        OR email ILIKE :search
        OR (first_name || ' ' || last_name) ILIKE :search",
        search: search
      )
    end

    employees = employees.where(country_id: params[:country_id]) if params[:country_id].present?
    employees = employees.where(department: params[:department]) if params[:department].present?
    employees = employees.where(employment_status: params[:employment_status]) if params[:employment_status].present?

    total = employees.count
    total_pages = (total.to_f / per_page).ceil

    employees = employees
      .order(:employee_number)
      .limit(per_page)
      .offset((page - 1) * per_page)
      .to_a

    # Fetch current salaries for this page in one query.
    employee_ids = employees.map(&:id)

    current_salaries = SalaryRecord
      .where(employee_id: employee_ids)
      .where("effective_from <= ?", Date.current)
      .order(employee_id: :asc, effective_from: :desc, id: :desc)
      .group_by(&:employee_id)
      .transform_values(&:first)

    employee_data = employees.map do |employee|
      employee.as_json(
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
      ).merge(
        "current_salary" => current_salaries[employee.id]&.as_json(
          only: [:id, :amount, :currency, :effective_from]
        )
      )
    end

    render json: {
      employees: employee_data,
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

    salary_history = employee.salary_records
      .order(effective_from: :desc, id: :desc)

    current_salary = employee.salary_records
      .where("effective_from <= ?", Date.current)
      .order(effective_from: :desc, id: :desc)
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
    render json: {
      error: "Employee not found"
    }, status: :not_found
  end
end
