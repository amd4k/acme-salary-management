require "test_helper"

class Api::V1::EmployeesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
      password: "secure-password"
    )

    @country = Country.create!(
      name: "United States",
      code: "US"
    )

    3.times do |i|
      Employee.create!(
        employee_number: "EMP-#{i + 1}",
        first_name: "Employee",
        last_name: "#{i + 1}",
        email: "employee#{i + 1}@example.com",
        country: @country,
        department: "Engineering",
        employment_status: "active"
      )
    end

    @token = JsonWebToken.encode(@user.id)
  end

  test "returns unauthorized without a token" do
    get "/api/v1/employees"

    assert_response :unauthorized
    assert_equal "Unauthorized", JSON.parse(response.body)["error"]
  end

  test "returns employees with a valid token" do
    get "/api/v1/employees",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 3, body["employees"].length
    assert_equal 1, body["pagination"]["page"]
    assert_equal 25, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "returns paginated employees" do
    get "/api/v1/employees?page=1&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 2, body["employees"].length
    assert_equal "EMP-1", body["employees"][0]["employee_number"]
    assert_equal "EMP-2", body["employees"][1]["employee_number"]

    assert_equal 1, body["pagination"]["page"]
    assert_equal 2, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 2, body["pagination"]["total_pages"]
  end

  test "returns the next page of employees" do
    get "/api/v1/employees?page=2&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]

    assert_equal 2, body["pagination"]["page"]
    assert_equal 2, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 2, body["pagination"]["total_pages"]
  end

  test "rejects an invalid page number" do
    get "/api/v1/employees?page=0&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :bad_request
    assert_equal(
      "Invalid pagination parameters",
      JSON.parse(response.body)["error"]
    )
  end

  test "rejects a per_page value greater than 100" do
    get "/api/v1/employees?page=1&per_page=101",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :bad_request
    assert_equal(
      "Invalid pagination parameters",
      JSON.parse(response.body)["error"]
    )
  end
end
