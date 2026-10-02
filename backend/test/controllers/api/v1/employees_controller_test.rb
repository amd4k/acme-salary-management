require "test_helper"

class Api::V1::EmployeesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
      password: "secure-password"
    )

    @token = JsonWebToken.encode(@user.id)
  end

  test "returns unauthorized without a token" do
    get "/api/v1/employees"

    assert_response :unauthorized
    assert_equal "Unauthorized", JSON.parse(response.body)["error"]
  end

  test "returns authenticated user with a valid token" do
    get "/api/v1/employees",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal "You are authenticated", body["message"]
    assert_equal @user.id, body["user"]["id"]
    assert_equal @user.email, body["user"]["email"]
  end
end
