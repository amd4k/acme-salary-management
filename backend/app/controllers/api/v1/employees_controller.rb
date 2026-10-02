class Api::V1::EmployeesController < ApplicationController
  include Authenticatable

  def index
    render json: {
      message: "You are authenticated",
      user: {
        id: current_user.id,
        email: current_user.email
      }
    }
  end
end
