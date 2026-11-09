-- migration: limit_service_role
-- הפרויקט נתן ל-service_role את כל ההרשאות על הטבלה החדשה, כולל delete ו-truncate.
-- משאירים לו רק את מה שהמוצר צריך: select, insert, update.

revoke all on public.jokes from service_role;
grant select, insert, update on public.jokes to service_role;
