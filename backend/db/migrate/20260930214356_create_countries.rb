class CreateCountries < ActiveRecord::Migration[8.1]
  def change
    create_table :countries do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.index :code, unique: true

      t.timestamps
    end
  end
end
