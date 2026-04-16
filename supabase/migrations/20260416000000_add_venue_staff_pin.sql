alter table venues
  add column if not exists staff_override_pin varchar(10) default null;
