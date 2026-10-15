class Api::V1::SalaryRecordsController < ApplicationController
  include Authenticatable

  def index
    page = params.fetch(:page, 1).to_i
    per_page = params.fetch(:per_page, 25).to_i

    if page < 1 || per_page < 1 || per_page > 100
      return render json: {
        error: "Invalid pagination parameters"
      }, status: :bad_request
    end

    salary_records = SalaryRecord
      .joins(:employee)
      .includes(employee: :country)

    if params[:search].present?
      search = "%#{params[:search].strip}%"

      salary_records = salary_records.where(
        "employees.employee_number ILIKE :search
        OR employees.first_name ILIKE :search
        OR employees.last_name ILIKE :search
        OR employees.email ILIKE :search
        OR employees.department ILIKE :search
        OR (employees.first_name || ' ' || employees.last_name) ILIKE :search",
        search: search
      )
    end

    total = salary_records.count
    total_pages = (total.to_f / per_page).ceil

    salary_records = salary_records
      .order(effective_from: :desc, id: :desc)
      .limit(per_page)
      .offset((page - 1) * per_page)

    render json: {
      salary_records: salary_records.map do |record|
        {
          id: record.id,
          employee_id: record.employee_id,
          amount: record.amount,
          currency: record.currency,
          effective_from: record.effective_from,
          reason: record.reason,
          created_by_id: record.created_by_id,
          updated_by_id: record.updated_by_id,
          employee: {
            id: record.employee.id,
            employee_number: record.employee.employee_number,
            first_name: record.employee.first_name,
            last_name: record.employee.last_name,
            department: record.employee.department,
            country: {
              name: record.employee.country.name,
              code: record.employee.country.code
            }
          }
        }
      end,
      pagination: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: total_pages
      }
    }
  end

  def create
    employee = Employee.find(params[:employee_id])

    if current_user.employee_id == employee.id
      return render json: { error: "You cannot change your own salary" }, status: :forbidden
    end

    salary_record = employee.salary_records.create!(
      salary_record_params.merge(created_by: current_user)
    )

    render json: {
      salary_record: salary_record.as_json(
        only: [
          :id,
          :employee_id,
          :amount,
          :currency,
          :effective_from,
          :reason,
          :created_by_id
        ]
      )
    }, status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Employee not found" }, status: :not_found
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  
  def update
    employee = Employee.find(params[:employee_id])
    salary_record = employee.salary_records.find(params[:id])

    if current_user.employee_id == employee.id
      return render json: {
        error: "You cannot change your own salary"
      }, status: :forbidden
    end

    salary_record.update!(
      salary_record_params.merge(updated_by: current_user)
    )

    render json: {
      salary_record: salary_record.as_json(
        only: [
          :id,
          :employee_id,
          :amount,
          :currency,
          :effective_from,
          :reason,
          :created_by_id,
          :updated_by_id
        ]
      )
    }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: {
      error: "Employee or salary record not found"
    }, status: :not_found
  rescue ActiveRecord::RecordInvalid => e
    render json: {
      error: e.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  private

  def salary_record_params
    params.require(:salary_record).permit(
      :amount,
      :currency,
      :effective_from,
      :reason
    )
  end
end
