class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :employee_number, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.references :country, null: false, foreign_key: true
      t.string :department, null: false
      t.string :employment_status, null: false

      t.timestamps
    end

    add_index :employees, :employee_number, unique: true
  end
end