export default {
  "inter-token": ["BINARY", "national", "STORED"],
  "match-token": ["VIRTUAL", "type = innodb", "default 0000-00-00 00:00:00", "default 0000-00-00", "CONSTRAINT check_active"],
  "function": ["GENERATED", "CHECK", "PARTITION BY LIST (transaction_type)"]
}
