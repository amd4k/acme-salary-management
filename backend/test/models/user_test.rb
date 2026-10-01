require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "is valid with required attributes" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password_digest: "test-password-digest"
    )

    assert user.valid?
  end

  test "does not require an employee" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password_digest: "test-password-digest"
    )

    assert user.valid?
    assert_nil user.employee
  end

  test "requires an email" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: nil,
      password_digest: "test-password-digest"
    )

    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "requires a unique email" do
    User.create!(
      first_name: "Existing",
      last_name: "HR",
      email: "hr@example.com",
      password_digest: "test-password-digest"
    )

    user = User.new(
      first_name: "Another",
      last_name: "HR",
      email: "hr@example.com",
      password_digest: "test-password-digest"
    )

    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end
end
