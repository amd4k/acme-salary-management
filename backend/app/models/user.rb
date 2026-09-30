class User < ApplicationRecord
  belongs_to :employee, optional: true
end
