class CreateSalaryRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :salary_records do |t|
      t.references :employee, null: false, foreign_key: true
      t.decimal :amount
      t.string :currency
      t.date :effective_from
      t.string :reason
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      
      t.timestamps
    end
  end
end
