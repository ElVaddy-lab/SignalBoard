# Generate project activity in the database

SignalBoard generates immutable Project Activity through PostgreSQL triggers on Project inserts, updates, and deletes rather than relying on application code to write matching events. This keeps history complete across UI actions, server-side operations, and sample-data loading, and preserves deletion snapshots; the trade-off is more sophisticated SQL migrations and database-level tests.
