module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request!
  end

  private

  def authenticate_request!
    authorization = request.headers["Authorization"]

    token = if authorization&.start_with?("Bearer ")
      authorization.split(" ", 2).last
    end

    payload = JsonWebToken.decode(token)

    @current_user = User.find_by(id: payload["sub"]) if payload

    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end

  def current_user
    @current_user
  end
end
