def ensure_storage_data_column(engine):
    from sqlalchemy import text, inspect
    insp = inspect(engine)
    cols = [c['name'] for c in insp.get_columns('storage_objects')]
    with engine.begin() as conn:
        if 'data' not in cols:
            conn.execute(text('ALTER TABLE storage_objects ADD COLUMN data BYTEA'))
        if 'etag' not in cols:
            conn.execute(text('ALTER TABLE storage_objects ADD COLUMN etag VARCHAR(100)'))
