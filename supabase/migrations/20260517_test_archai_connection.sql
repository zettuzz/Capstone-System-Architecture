-- Test migration to verify ArchAI database connectivity
-- This creates a simple test table to confirm write access

create table if not exists archai_connection_test (
    id serial primary key,
    test_message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert a test record
insert into archai_connection_test (test_message) values ('ArchAI database connection verified at ' || now());

-- Select the test record to confirm
select * from archai_connection_test order by created_at desc limit 1;