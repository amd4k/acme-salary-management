
require "test_helper"

class Api::V1::DashboardControllerTest < ActionDispatch::IntegrationTest
  setup do
    @country_us = Country.create!(
      name: "United States",
      code: "US"
    )

    @country_ca = Country.create!(
      name: "Canada",
      code: "CA"
    )

    @user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
      password: "secure-password"
    )

    @token = JsonWebToken.encode(@user.id)

    create_employees
  end

  test "requires authentication" do
    get "/api/v1/dashboard/statistics"

    assert_response :unauthorized
    assert_equal "Unauthorized", JSON.parse(response.body)["error"]
  end

  test "returns organization-wide statistics for an authenticated user" do
    get "/api/v1/dashboard/statistics",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    statistics = JSON.parse(response.body)["statistics"]

    assert_equal 3, statistics["total_employees"]
    assert_equal 2, statistics["active_employees"]
    assert_equal 2, statistics["total_departments"]
    assert_equal 1, statistics["total_countries"]
  end

  test "counts only active employees when calculating departments and countries" do
    get "/api/v1/dashboard/statistics",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    statistics = JSON.parse(response.body)["statistics"]

    # The inactive employee belongs to Canada and Engineering.
    # Neither should add to the active employee department/country counts.
    assert_equal 2, statistics["active_employees"]
    assert_equal 2, statistics["total_departments"]
    assert_equal 1, statistics["total_countries"]
  end

  private

  def create_employees
    Employee.create!(
      employee_number: "EMP-1",
      first_name: "Employee",
      last_name: "One",
      email: "employee1@example.com",
      country: @country_us,
      department: "Engineering",
      employment_status: "active"
    )

    Employee.create!(
      employee_number: "EMP-2",
      first_name: "Employee",
      last_name: "Two",
      email: "employee2@example.com",
      country: @country_us,
      department: "Finance",
      employment_status: "active"
    )

    Employee.create!(
      employee_number: "EMP-3",
      first_name: "Employee",
      last_name: "Three",
      email: "employee3@example.com",
      country: @country_ca,
      department: "Engineering",
      employment_status: "inactive"
    )
  end
end
