
class Api::V1::DashboardController < ApplicationController
  include Authenticatable

  def statistics
    active_employees = Employee.where(employment_status: "active")

    render json: {
      statistics: {
        total_employees: Employee.count,
        active_employees: active_employees.count,
        total_departments: active_employees
          .where.not(department: [nil, ""])
          .distinct
          .count(:department),
        total_countries: active_employees
          .distinct
          .count(:country_id)
      }
    }
  end
end
