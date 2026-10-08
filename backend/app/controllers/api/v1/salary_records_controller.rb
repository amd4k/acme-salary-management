class Api::V1::SalaryRecordsController < ApplicationController
  include Authenticatable

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
        return render json: { error: "You cannot change your own salary" }, status: :forbidden
    end

    salary_record.update!(salary_record_params)

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
    }, status: :ok
    
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Employee or salary record not found" }, status: :not_found
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.record.errors.full_messages }, status: :unprocessable_entity
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
