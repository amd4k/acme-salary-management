require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
      password: "secure-password"
    )
  end

  test "logs in with valid credentials" do
    post "/api/v1/login",
         params: {
           email: @user.email,
           password: "secure-password"
         },
         as: :json

    assert_response :success

    response_body = JSON.parse(response.body)

    assert response_body["token"].present?
    assert_equal @user.id, response_body.dig("user", "id")
    assert_equal @user.email, response_body.dig("user", "email")
  end

  test "rejects invalid password" do
    post "/api/v1/login",
         params: {
           email: @user.email,
           password: "wrong-password"
         },
         as: :json

    assert_response :unauthorized

    response_body = JSON.parse(response.body)

    assert_equal "Invalid email or password", response_body["error"]
  end

  test "rejects unknown email" do
    post "/api/v1/login",
         params: {
           email: "unknown@example.com",
           password: "secure-password"
         },
         as: :json

    assert_response :unauthorized

    response_body = JSON.parse(response.body)

    assert_equal "Invalid email or password", response_body["error"]
  end
end
