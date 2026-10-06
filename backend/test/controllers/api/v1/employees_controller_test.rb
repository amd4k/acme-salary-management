require "test_helper"

class Api::V1::EmployeesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
      password: "secure-password"
    )

    create_countries
    create_employees

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

  test "searches employees by last name" do
    get "/api/v1/employees?search=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-2", body["employees"][0]["employee_number"]
  end

  test "searches employees by email" do
    get "/api/v1/employees?search=employee3@example.com",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
  end
  
  test "searches employees by employee number" do
    get "/api/v1/employees?search=EMP-2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-2", body["employees"][0]["employee_number"]
  end

  test "searches employees by first name" do
    get "/api/v1/employees?search=Employee",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 3, body["employees"].length
  end

  test "search is case insensitive" do
    get "/api/v1/employees?search=EMPLOYEE3@EXAMPLE.COM",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
  end  

  test "paginates search results" do
    get "/api/v1/employees?search=Employee&page=2&per_page=2",
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

  test "filters employees by department" do
    get "/api/v1/employees?department=Finance",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-2", body["employees"][0]["employee_number"]
    assert_equal "Finance", body["employees"][0]["department"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "filters employees by employment status" do
    get "/api/v1/employees?employment_status=inactive",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
    assert_equal "inactive", body["employees"][0]["employment_status"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "filters employees by country" do
    get "/api/v1/employees?country_id=#{@country_ca.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
    assert_equal "Canada", body["employees"][0]["country"]["name"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "combines multiple employee filters" do
    get "/api/v1/employees?department=Engineering&employment_status=active",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-1", body["employees"][0]["employee_number"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end


  private

  def create_countries
    @country_us = Country.create!(
      name: "United States",
      code: "US"
    )

    @country_ca = Country.create!(
      name: "Canada",
      code: "CA"
    )
  end

  def create_employees
    Employee.create!(
      employee_number: "EMP-1",
      first_name: "Employee",
      last_name: "1",
      email: "employee1@example.com",
      country: @country_us,
      department: "Engineering",
      employment_status: "active"
    )

    Employee.create!(
      employee_number: "EMP-2",
      first_name: "Employee",
      last_name: "2",
      email: "employee2@example.com",
      country: @country_us,
      department: "Finance",
      employment_status: "active"
    )

    Employee.create!(
      employee_number: "EMP-3",
      first_name: "Employee",
      last_name: "3",
      email: "employee3@example.com",
      country: @country_ca,
      department: "Engineering",
      employment_status: "inactive"
    )
  end
  
end
