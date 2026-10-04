class Api::V1::EmployeesController < ApplicationController
  include Authenticatable

  def index
    page = params.fetch(:page, 1).to_i
    per_page = params.fetch(:per_page, 25).to_i

    if page < 1 || per_page < 1 || per_page > 100
      return render json: { error: "Invalid pagination parameters" }, status: :bad_request
    end

    employees = Employee
      .includes(:country)
      .order(:employee_number)
      .limit(per_page)
      .offset((page - 1) * per_page)

    total = Employee.count
    total_pages = (total.to_f / per_page).ceil

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
end
