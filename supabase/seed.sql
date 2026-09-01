SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '6f857eca-d413-4051-a77e-ec68124ed613', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"customer_a_1788001697562@example.com","user_id":"8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5","user_phone":""}}', '2026-08-29 11:08:21.319927+00', ''),
	('00000000-0000-0000-0000-000000000000', 'afaa1328-2e91-4225-b6d4-12e6db1b75dc', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"customer_b_1788001697562@example.com","user_id":"63058e8f-b5b9-426e-a2ed-8e20a44f3b8e","user_phone":""}}', '2026-08-29 11:08:21.790386+00', ''),
	('00000000-0000-0000-0000-000000000000', '5812f69f-a8a5-4c12-aa5b-73cab9443aea', '{"action":"login","actor_id":"8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5","actor_username":"customer_a_1788001697562@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:08:22.286226+00', ''),
	('00000000-0000-0000-0000-000000000000', '1fa76dec-e652-4b5c-ba2b-f71a5e8d0c4a', '{"action":"login","actor_id":"63058e8f-b5b9-426e-a2ed-8e20a44f3b8e","actor_username":"customer_b_1788001697562@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:08:22.714028+00', ''),
	('00000000-0000-0000-0000-000000000000', '024ce65c-578b-4cc8-a507-31db3332a9e6', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"customer_a_1788001739992@example.com","user_id":"83681d1e-16f3-4b9a-9bd2-83d0ea9204a3","user_phone":""}}', '2026-08-29 11:09:00.40217+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f046a27-1424-4fc3-bb1f-8bb7286f3d1d', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"customer_b_1788001739992@example.com","user_id":"93218371-8eef-4196-93d4-c22368939498","user_phone":""}}', '2026-08-29 11:09:00.712535+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f0c9349-2445-419a-9e16-84e64a4b6551', '{"action":"login","actor_id":"83681d1e-16f3-4b9a-9bd2-83d0ea9204a3","actor_username":"customer_a_1788001739992@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:09:00.917087+00', ''),
	('00000000-0000-0000-0000-000000000000', '1b375844-9964-44f9-ac3b-8bfc04d6d87e', '{"action":"login","actor_id":"93218371-8eef-4196-93d4-c22368939498","actor_username":"customer_b_1788001739992@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:09:01.048369+00', ''),
	('00000000-0000-0000-0000-000000000000', 'db737ae2-eb08-4edd-8f42-de10b48481da', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788002847865@example.com","user_id":"a14e16eb-4f84-4572-9828-8efeebf9fcdf","user_phone":""}}', '2026-08-29 11:27:31.541966+00', ''),
	('00000000-0000-0000-0000-000000000000', '1dc41f49-a610-482e-a5b6-fda05e87ca97', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788003006467@example.com","user_id":"71ae826c-a97b-400c-91f6-b86b70e064cd","user_phone":""}}', '2026-08-29 11:30:09.559673+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9a23fbe-c6c6-4926-9b9c-1a6ddd249706', '{"action":"login","actor_id":"71ae826c-a97b-400c-91f6-b86b70e064cd","actor_username":"admin_1788003006467@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:30:29.908042+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d7865c5-cac9-4d89-8e11-d294804d9c1f', '{"action":"user_signedup","actor_id":"a3d201a9-d49e-4106-a881-228e639f0f0d","actor_username":"auth_test_1788003019853@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:30:30.583758+00', ''),
	('00000000-0000-0000-0000-000000000000', '6ee62f3a-41c0-4595-9f10-6bbfc233f56b', '{"action":"login","actor_id":"a3d201a9-d49e-4106-a881-228e639f0f0d","actor_username":"auth_test_1788003019853@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:30:30.964291+00', ''),
	('00000000-0000-0000-0000-000000000000', '57c44cbd-4c03-4ca7-b76b-3807210c17fe', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788003233850@example.com","user_id":"bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e","user_phone":""}}', '2026-08-29 11:33:55.70337+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d6a8544-a4af-49f3-abc5-ddcc7b8eab77', '{"action":"login","actor_id":"bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e","actor_username":"admin_1788003233850@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:34:15.35659+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f044b16-1a80-43d0-88bb-9bffac3d54ab', '{"action":"user_signedup","actor_id":"f4043e11-b497-48b8-98a3-5bc51315171f","actor_username":"auth_test_1788003244078@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:34:16.476792+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a685b16e-ca85-4cf8-ae2a-9b73b66163e7', '{"action":"login","actor_id":"f4043e11-b497-48b8-98a3-5bc51315171f","actor_username":"auth_test_1788003244078@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:34:17.241469+00', ''),
	('00000000-0000-0000-0000-000000000000', '585648c6-a911-4979-a6b3-3499eeab31e8', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788003344804@example.com","user_id":"e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8","user_phone":""}}', '2026-08-29 11:35:46.220325+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bee12dbb-b3f0-411d-b6b9-c88c4356f0e9', '{"action":"login","actor_id":"e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8","actor_username":"admin_1788003344804@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:35:55.260096+00', ''),
	('00000000-0000-0000-0000-000000000000', '235f2340-b4a5-4c42-ae2d-ea97dd48788d', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788003489577@example.com","user_id":"c121fa79-47f2-4556-8ef5-feea4d788087","user_phone":""}}', '2026-08-29 11:38:12.425292+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c706dcdb-0c49-4505-a411-d86d6f2e41a7', '{"action":"user_signedup","actor_id":"26fba916-be07-4aa6-866a-edcf948655bc","actor_username":"auth_test_1788003505270@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:38:28.486254+00', ''),
	('00000000-0000-0000-0000-000000000000', '33d751fc-c6c8-406e-8df0-ca966de216ed', '{"action":"login","actor_id":"26fba916-be07-4aa6-866a-edcf948655bc","actor_username":"auth_test_1788003505270@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:38:28.545581+00', ''),
	('00000000-0000-0000-0000-000000000000', '133f3f99-2a1b-4661-9e6c-0361c6851a91', '{"action":"login","actor_id":"c121fa79-47f2-4556-8ef5-feea4d788087","actor_username":"admin_1788003489577@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:38:28.549488+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ec23791b-abbe-4049-976d-2bcb313c5e3f', '{"action":"login","actor_id":"26fba916-be07-4aa6-866a-edcf948655bc","actor_username":"auth_test_1788003505270@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:38:44.746239+00', ''),
	('00000000-0000-0000-0000-000000000000', '7cad32b7-a23c-4ccd-a776-fc4c222484f3', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788003775181@example.com","user_id":"130a8ccf-30ba-441d-9fdd-c8833a398f09","user_phone":""}}', '2026-08-29 11:43:04.270317+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c27ac38b-f83d-40e9-8591-88e42c2f5bd2', '{"action":"user_signedup","actor_id":"c23b0c3c-84bf-489e-b885-0d555e54a4cf","actor_username":"auth_test_1788003799276@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:43:25.570935+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ca2edca-6969-4171-bcd2-613cf537206d', '{"action":"login","actor_id":"c23b0c3c-84bf-489e-b885-0d555e54a4cf","actor_username":"auth_test_1788003799276@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:43:25.61888+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c8ba3ae9-db32-47bc-9dd6-8b0db9bfe515', '{"action":"login","actor_id":"130a8ccf-30ba-441d-9fdd-c8833a398f09","actor_username":"admin_1788003775181@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:43:25.858869+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7ebdcf5-c685-4bf9-b0e5-91a368d87f93', '{"action":"login","actor_id":"c23b0c3c-84bf-489e-b885-0d555e54a4cf","actor_username":"auth_test_1788003799276@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:43:27.809067+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c3cb4822-f25c-4fb1-91de-9cf8fe51a3d2', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788004005001@example.com","user_id":"2d1808c5-695b-4b35-80aa-3002a26daa25","user_phone":""}}', '2026-08-29 11:46:53.315977+00', ''),
	('00000000-0000-0000-0000-000000000000', '813aa8e3-bfcf-4179-b78a-7af5d019ecdc', '{"action":"user_signedup","actor_id":"f746e1c1-8a36-4ff5-9c93-68b36a1494c7","actor_username":"auth_test_1788004009351@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:46:53.403612+00', ''),
	('00000000-0000-0000-0000-000000000000', '9f47cfee-7b1b-426a-8036-22c7367d296a', '{"action":"login","actor_id":"f746e1c1-8a36-4ff5-9c93-68b36a1494c7","actor_username":"auth_test_1788004009351@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:46:53.512659+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ba8d3ae8-fc3d-4aba-94da-c0cf70a5f92a', '{"action":"login","actor_id":"2d1808c5-695b-4b35-80aa-3002a26daa25","actor_username":"admin_1788004005001@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:47:02.317471+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f5918ed-4db7-45f1-9daf-95bf45ff32a9', '{"action":"login","actor_id":"f746e1c1-8a36-4ff5-9c93-68b36a1494c7","actor_username":"auth_test_1788004009351@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:47:05.890461+00', ''),
	('00000000-0000-0000-0000-000000000000', '4adbaf62-c4ec-4965-a8cb-8bc8bcd016aa', '{"action":"user_signedup","actor_id":"0422e297-2c09-4520-a57c-cf70ad493fcf","actor_username":"auth_test_1788004159038@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:49:22.726925+00', ''),
	('00000000-0000-0000-0000-000000000000', '74d8b8b1-b747-441a-9f79-cf59dbe5e2d5', '{"action":"login","actor_id":"0422e297-2c09-4520-a57c-cf70ad493fcf","actor_username":"auth_test_1788004159038@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:49:22.888335+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd5c5f87c-14d5-4a3f-8fe2-2f3775f4dfc7', '{"action":"login","actor_id":"0422e297-2c09-4520-a57c-cf70ad493fcf","actor_username":"auth_test_1788004159038@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:49:26.053692+00', ''),
	('00000000-0000-0000-0000-000000000000', '043f40a6-bef0-4f81-9cd5-497b22a23ecf', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788004504100@example.com","user_id":"200c4adc-688d-49e3-be53-6fa7a2dada9a","user_phone":""}}', '2026-08-29 11:55:14.486052+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cce361bd-adc3-4a7e-844b-5bc564fcee83', '{"action":"user_signedup","actor_id":"76c983b0-c405-4f10-9682-8482f8863936","actor_username":"auth_test_1788004508901@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 11:55:14.58822+00', ''),
	('00000000-0000-0000-0000-000000000000', '816d011a-d621-4519-8251-c672fb9f505b', '{"action":"login","actor_id":"76c983b0-c405-4f10-9682-8482f8863936","actor_username":"auth_test_1788004508901@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:55:14.996097+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e5cda54a-58f8-4e0a-ab5e-1722ff977793', '{"action":"login","actor_id":"200c4adc-688d-49e3-be53-6fa7a2dada9a","actor_username":"admin_1788004504100@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 11:55:19.155807+00', ''),
	('00000000-0000-0000-0000-000000000000', '2948db61-611f-401d-80b1-ec7243e70142', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788004947259@example.com","user_id":"0169c76d-ff68-48f5-9330-ac3fa8d02bb8","user_phone":""}}', '2026-08-29 12:02:32.589178+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c995286d-5085-4e5c-8d18-eb3e4436b823', '{"action":"login","actor_id":"0169c76d-ff68-48f5-9330-ac3fa8d02bb8","actor_username":"admin_1788004947259@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:02:43.334846+00', ''),
	('00000000-0000-0000-0000-000000000000', '54bc4729-cb4a-490a-b5bf-923b8ed623ca', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788007397171@example.com","user_id":"f3edeb9f-9878-4723-8fa7-36a4d34d345a","user_phone":""}}', '2026-08-29 12:43:21.459248+00', ''),
	('00000000-0000-0000-0000-000000000000', '254d0f60-f7ee-4984-b386-b075f5183d1b', '{"action":"user_signedup","actor_id":"0109cb11-8c24-4581-92a0-fdbaab70187f","actor_username":"auth_test_1788007400631@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 12:43:22.627172+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd207e9b0-1da3-435a-bf38-f539527e485f', '{"action":"login","actor_id":"0109cb11-8c24-4581-92a0-fdbaab70187f","actor_username":"auth_test_1788007400631@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:43:22.675508+00', ''),
	('00000000-0000-0000-0000-000000000000', '321705fe-8cf0-4b14-8d28-75a8c3532fcc', '{"action":"login","actor_id":"0109cb11-8c24-4581-92a0-fdbaab70187f","actor_username":"auth_test_1788007400631@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:43:27.131671+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f87cf86-847c-4d9a-be02-0669e71073f5', '{"action":"login","actor_id":"f3edeb9f-9878-4723-8fa7-36a4d34d345a","actor_username":"admin_1788007397171@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:43:27.338289+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c61e1a4b-c1db-4599-813a-3315af6dd572', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788007716727@example.com","user_id":"7bb18ae6-9a37-48ac-9831-7484677ecdc1","user_phone":""}}', '2026-08-29 12:48:39.593362+00', ''),
	('00000000-0000-0000-0000-000000000000', '8029256f-3c5e-460e-b8f3-4122134633c4', '{"action":"user_signedup","actor_id":"013447b6-0b04-4218-b6b6-964cc16b3e6c","actor_username":"auth_test_1788007722731@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 12:48:45.926015+00', ''),
	('00000000-0000-0000-0000-000000000000', '44bba85e-265e-4661-8915-f61ccf7edeb4', '{"action":"login","actor_id":"7bb18ae6-9a37-48ac-9831-7484677ecdc1","actor_username":"admin_1788007716727@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:48:45.947057+00', ''),
	('00000000-0000-0000-0000-000000000000', '613b26f0-003b-4832-b698-e8fa7ed0d2b9', '{"action":"login","actor_id":"013447b6-0b04-4218-b6b6-964cc16b3e6c","actor_username":"auth_test_1788007722731@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:48:45.968173+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b911352c-61c4-4155-b0f0-b12018212768', '{"action":"login","actor_id":"013447b6-0b04-4218-b6b6-964cc16b3e6c","actor_username":"auth_test_1788007722731@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:48:46.418817+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e2eb15f-5e4e-4934-a48e-921b52107112', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788007838435@example.com","user_id":"556dbc04-7a39-4382-9e1d-dd20a4add384","user_phone":""}}', '2026-08-29 12:50:39.995965+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd732013e-5356-4d01-bbdb-03e70abad1df', '{"action":"login","actor_id":"556dbc04-7a39-4382-9e1d-dd20a4add384","actor_username":"admin_1788007838435@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:50:45.503425+00', ''),
	('00000000-0000-0000-0000-000000000000', '97c0f468-4c98-4276-9caa-25949dbb690c', '{"action":"user_signedup","actor_id":"b258f487-cf2d-499d-a047-7d55715a0b4e","actor_username":"auth_test_1788007841163@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 12:50:49.134939+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a97f4c34-5d00-488e-85a7-ab42f5abea6a', '{"action":"login","actor_id":"b258f487-cf2d-499d-a047-7d55715a0b4e","actor_username":"auth_test_1788007841163@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:50:49.210726+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f1541da4-4936-4444-ae4c-664afabb5067', '{"action":"login","actor_id":"b258f487-cf2d-499d-a047-7d55715a0b4e","actor_username":"auth_test_1788007841163@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:50:50.900445+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c05e207-9eb4-4e53-984a-b226d60fec4f', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788007953109@example.com","user_id":"56cc2643-0c3d-4561-ab19-52733523e9cd","user_phone":""}}', '2026-08-29 12:52:36.152975+00', ''),
	('00000000-0000-0000-0000-000000000000', '9700e255-69d6-4491-b41c-ccba11a61bd6', '{"action":"user_signedup","actor_id":"f79bc07d-b968-4846-8991-ac3824bd89b2","actor_username":"auth_test_1788007957157@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 12:52:40.300173+00', ''),
	('00000000-0000-0000-0000-000000000000', '6ba6036e-1182-43a8-8c73-fdc37d1eed8e', '{"action":"login","actor_id":"f79bc07d-b968-4846-8991-ac3824bd89b2","actor_username":"auth_test_1788007957157@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:52:40.437851+00', ''),
	('00000000-0000-0000-0000-000000000000', '63cbb87e-e59a-416d-b319-d5d923734a55', '{"action":"login","actor_id":"f79bc07d-b968-4846-8991-ac3824bd89b2","actor_username":"auth_test_1788007957157@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:52:42.160822+00', ''),
	('00000000-0000-0000-0000-000000000000', '16bc3054-3db7-4ec6-a85c-1ef5c3a0a211', '{"action":"login","actor_id":"56cc2643-0c3d-4561-ab19-52733523e9cd","actor_username":"admin_1788007953109@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:52:42.219348+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bb33e37f-2451-454e-9a3b-e28527c3539a', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788008156036@example.com","user_id":"92b50b56-264a-4d12-9c60-f461c7fe5d62","user_phone":""}}', '2026-08-29 12:55:57.643536+00', ''),
	('00000000-0000-0000-0000-000000000000', '578a4c86-2c9a-4b84-a7a5-6c7b13c16540', '{"action":"login","actor_id":"92b50b56-264a-4d12-9c60-f461c7fe5d62","actor_username":"admin_1788008156036@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:56:01.958316+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e95e6c7d-d288-45b7-8a28-839637414c24', '{"action":"user_signedup","actor_id":"d48eb217-ebc8-4b28-a981-aee75cad7a66","actor_username":"auth_test_1788008161739@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 12:56:03.131619+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fdd96e97-96b3-461a-8688-32178199280e', '{"action":"login","actor_id":"d48eb217-ebc8-4b28-a981-aee75cad7a66","actor_username":"auth_test_1788008161739@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:56:03.169792+00', ''),
	('00000000-0000-0000-0000-000000000000', '76999176-b142-4d11-9d6f-8b60c45c4727', '{"action":"login","actor_id":"d48eb217-ebc8-4b28-a981-aee75cad7a66","actor_username":"auth_test_1788008161739@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:56:03.625268+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dfeaf1d4-ddcd-4c35-ac4d-410d87b73a1f', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788008276045@example.com","user_id":"92346415-7367-4a11-96de-faf84f00f0f8","user_phone":""}}', '2026-08-29 12:57:58.214718+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f0fb7c9-61c8-4f96-9aa1-2cb0a8d5dcab', '{"action":"user_signedup","actor_id":"58503c92-9399-4a82-955b-25724a3f4cbc","actor_username":"auth_test_1788008283935@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 12:58:06.365779+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c67f354f-5681-44d5-80d2-8d5f3bbf6053', '{"action":"login","actor_id":"92346415-7367-4a11-96de-faf84f00f0f8","actor_username":"admin_1788008276045@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:58:06.37657+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bbc4f200-7397-4212-96ff-244b4b3ba962', '{"action":"login","actor_id":"58503c92-9399-4a82-955b-25724a3f4cbc","actor_username":"auth_test_1788008283935@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:58:06.486104+00', ''),
	('00000000-0000-0000-0000-000000000000', '102f86e7-853d-4e4e-9aaa-267ce2b97a64', '{"action":"login","actor_id":"58503c92-9399-4a82-955b-25724a3f4cbc","actor_username":"auth_test_1788008283935@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 12:58:13.4996+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fa82c89b-fbce-4296-bbd2-4b14c43972a6', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin_1788008601483@example.com","user_id":"64f314bd-1e50-468d-a4fd-bd9ea1a381ab","user_phone":""}}', '2026-08-29 13:03:23.599307+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd27845e1-6841-4b93-b669-7817d37ee0df', '{"action":"user_signedup","actor_id":"1d478337-7633-4a29-892c-c152986f0d00","actor_username":"auth_test_1788008606635@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-29 13:03:29.251324+00', ''),
	('00000000-0000-0000-0000-000000000000', '12d2d0fd-4c0f-4e53-8dcb-e27472dead1c', '{"action":"login","actor_id":"1d478337-7633-4a29-892c-c152986f0d00","actor_username":"auth_test_1788008606635@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 13:03:29.341787+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd11f4af4-a257-47bf-b716-81fdc1b50c22', '{"action":"login","actor_id":"64f314bd-1e50-468d-a4fd-bd9ea1a381ab","actor_username":"admin_1788008601483@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 13:03:31.499411+00', ''),
	('00000000-0000-0000-0000-000000000000', '0e0300f6-f7e6-48aa-8055-5032319b3a2f', '{"action":"login","actor_id":"1d478337-7633-4a29-892c-c152986f0d00","actor_username":"auth_test_1788008606635@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-29 13:03:32.981697+00', ''),
	('00000000-0000-0000-0000-000000000000', '4d171631-d4c1-4f2f-a851-44ccd8124ab5', '{"action":"user_signedup","actor_id":"c7f08ac4-273e-484b-a96a-49c136bcdbf5","actor_username":"admin@store.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-09-01 07:21:01.023887+00', ''),
	('00000000-0000-0000-0000-000000000000', '72f563a2-c37f-47c0-b525-c18480455ac5', '{"action":"login","actor_id":"c7f08ac4-273e-484b-a96a-49c136bcdbf5","actor_username":"admin@store.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-09-01 07:21:01.062242+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f6473e50-7431-4d07-aee2-e122edcf4a3c', '{"action":"login","actor_id":"c7f08ac4-273e-484b-a96a-49c136bcdbf5","actor_username":"admin@store.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-09-01 07:21:01.283606+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ab9b298-c6f3-416c-b70e-ed5ba358925f', '{"action":"user_signedup","actor_id":"235ebf98-780e-4158-abda-436d2d876510","actor_username":"favazmk12@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-09-01 07:25:53.512121+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f32245bf-8457-422a-8915-10dfee362edc', '{"action":"login","actor_id":"235ebf98-780e-4158-abda-436d2d876510","actor_username":"favazmk12@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-09-01 07:25:53.53674+00', ''),
	('00000000-0000-0000-0000-000000000000', '42eefc78-f174-40f2-9db6-5d4485eede88', '{"action":"login","actor_id":"235ebf98-780e-4158-abda-436d2d876510","actor_username":"favazmk12@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-09-01 07:25:53.718542+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '26fba916-be07-4aa6-866a-edcf948655bc', 'authenticated', 'authenticated', 'auth_test_1788003505270@example.com', '$2a$10$PcoBQUP7TpUr4hf6UZ/jSeJjTv0ib1IB9ATQXAQPHaX7UpBetyuoe', '2026-08-29 11:38:28.492791+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:38:45.101138+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "26fba916-be07-4aa6-866a-edcf948655bc", "name": "Auth Test User", "email": "auth_test_1788003505270@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:38:28.409368+00', '2026-08-29 11:38:47.356088+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', 'authenticated', 'authenticated', 'customer_a_1788001697562@example.com', '$2a$10$OS83bea230WnURf2sGnXEeI296G2IBptbTIN.wx0WixPz2G.QEpBS', '2026-08-29 11:08:21.355598+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:08:22.289208+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-08-29 11:08:20.52528+00', '2026-08-29 11:08:22.431144+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '63058e8f-b5b9-426e-a2ed-8e20a44f3b8e', 'authenticated', 'authenticated', 'customer_b_1788001697562@example.com', '$2a$10$imOSkDpv845DoY5h85nqMukFbOWz.IeUxGK0uWRvad2mzizMarRsm', '2026-08-29 11:08:21.794397+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:08:22.715282+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-08-29 11:08:21.780905+00', '2026-08-29 11:08:22.724579+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8', 'authenticated', 'authenticated', 'admin_1788003344804@example.com', '$2a$10$izrsuM2DI92lOtzwoT5Fxu/uucVXYcn7uNgNidqhTN3Z.Uu5c9Y02', '2026-08-29 11:35:46.246954+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:35:55.270382+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:35:45.862649+00', '2026-08-29 11:35:55.474844+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e', 'authenticated', 'authenticated', 'admin_1788003233850@example.com', '$2a$10$wifjdPOvj2g9eh/6YG0pc.KkgDL4IZzDXi6rTzs9F0/iARZHHKW9.', '2026-08-29 11:33:55.722524+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:34:16.222695+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:33:55.595021+00', '2026-08-29 11:34:16.584943+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'a3d201a9-d49e-4106-a881-228e639f0f0d', 'authenticated', 'authenticated', 'auth_test_1788003019853@example.com', '$2a$10$I0zpIUXA0cuh4nBampSnNe8ZRX7ypkAal3gFxbeYV4eBshJdjxqFq', '2026-08-29 11:30:30.625257+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:30:30.976587+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "a3d201a9-d49e-4106-a881-228e639f0f0d", "name": "Auth Test User", "email": "auth_test_1788003019853@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:30:28.843185+00', '2026-08-29 11:30:31.563058+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '71ae826c-a97b-400c-91f6-b86b70e064cd', 'authenticated', 'authenticated', 'admin_1788003006467@example.com', '$2a$10$dsHeJeJiBwgembwMrcQ.peeR2mUbB4MFhC5o/UQl8JIlBBJxPzNX2', '2026-08-29 11:30:09.59573+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:30:29.924819+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:30:09.324686+00', '2026-08-29 11:30:31.580484+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', 'authenticated', 'authenticated', 'customer_a_1788001739992@example.com', '$2a$10$Hnowl2Bkzlb4ffr9BOJUMOR4SBpgNdSZs0uwahE33cUBk89B6mIvK', '2026-08-29 11:09:00.406776+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:09:00.919593+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-08-29 11:09:00.347368+00', '2026-08-29 11:09:00.925374+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '93218371-8eef-4196-93d4-c22368939498', 'authenticated', 'authenticated', 'customer_b_1788001739992@example.com', '$2a$10$wt1oXx6kCBAOQ0VwPeoOr.w6SolraziiqGiZCIXNVFLbpE2LvHBdK', '2026-08-29 11:09:00.7211+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:09:01.050166+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-08-29 11:09:00.704035+00', '2026-08-29 11:09:01.053149+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '130a8ccf-30ba-441d-9fdd-c8833a398f09', 'authenticated', 'authenticated', 'admin_1788003775181@example.com', '$2a$10$hWjlHp23On5yhchxak6x0.w7Urcn5/2BIJRPBiRXzkI.bEQychQ8i', '2026-08-29 11:43:04.316674+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:43:25.869709+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:43:04.167364+00', '2026-08-29 11:43:25.881136+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'a14e16eb-4f84-4572-9828-8efeebf9fcdf', 'authenticated', 'authenticated', 'admin_1788002847865@example.com', '$2a$10$N7rfFVU53AyO3aLDtTLxz.rUPTwB/hxoFe40EbUCby9hOT1xQojqC', '2026-08-29 11:27:31.592815+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:27:31.419447+00', '2026-08-29 11:27:31.606817+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c121fa79-47f2-4556-8ef5-feea4d788087', 'authenticated', 'authenticated', 'admin_1788003489577@example.com', '$2a$10$QVb6QpeWwHh/qmXzssgteuTTK8VffuWD8WwdNMk8y9NKVqN8609ny', '2026-08-29 11:38:12.447672+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:38:28.551488+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:38:12.308103+00', '2026-08-29 11:38:28.672913+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f4043e11-b497-48b8-98a3-5bc51315171f', 'authenticated', 'authenticated', 'auth_test_1788003244078@example.com', '$2a$10$zoCuBHwvBYk6avreAFdPRuNvwHhISKxBirHlTZUNwZx1SzTucgtXC', '2026-08-29 11:34:16.482139+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:34:17.313373+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "f4043e11-b497-48b8-98a3-5bc51315171f", "name": "Auth Test User", "email": "auth_test_1788003244078@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:34:14.433499+00', '2026-08-29 11:34:17.446956+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2d1808c5-695b-4b35-80aa-3002a26daa25', 'authenticated', 'authenticated', 'admin_1788004005001@example.com', '$2a$10$jtoHprr3Of3yMgbVhoBkUeWFNPuvQ85cROSpw8ECMfa/cIjr0s6HO', '2026-08-29 11:46:53.371214+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:47:02.354189+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:46:52.917961+00', '2026-08-29 11:47:02.403114+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c23b0c3c-84bf-489e-b885-0d555e54a4cf', 'authenticated', 'authenticated', 'auth_test_1788003799276@example.com', '$2a$10$ltOGKeFCaax6B4RRzn5faOpciNjQs1S56QJ6PrM3wO2cbTbUVrms.', '2026-08-29 11:43:25.585114+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:43:27.813234+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c23b0c3c-84bf-489e-b885-0d555e54a4cf", "name": "Auth Test User", "email": "auth_test_1788003799276@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:43:25.440716+00', '2026-08-29 11:43:27.825571+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b258f487-cf2d-499d-a047-7d55715a0b4e', 'authenticated', 'authenticated', 'auth_test_1788007841163@example.com', '$2a$10$SBOqAgTR1CSiQxIYGiifIOOWhuEZWY9o2m9M6qfXlx8pK4je4c2LW', '2026-08-29 12:50:49.137971+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:50:50.903213+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "b258f487-cf2d-499d-a047-7d55715a0b4e", "name": "Auth Test User", "email": "auth_test_1788007841163@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 12:50:49.021096+00', '2026-08-29 12:50:50.921097+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f746e1c1-8a36-4ff5-9c93-68b36a1494c7', 'authenticated', 'authenticated', 'auth_test_1788004009351@example.com', '$2a$10$wOpIcvoh1/1pW1aGb1vUZOsn84qWQ9LCtwi6oLpISjeSQHU5cYSgC', '2026-08-29 11:46:53.406005+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:47:05.893659+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "f746e1c1-8a36-4ff5-9c93-68b36a1494c7", "name": "Auth Test User", "email": "auth_test_1788004009351@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:46:52.909932+00', '2026-08-29 11:47:05.975626+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '013447b6-0b04-4218-b6b6-964cc16b3e6c', 'authenticated', 'authenticated', 'auth_test_1788007722731@example.com', '$2a$10$Knoo8mUuX5ALLpCRawconOYEb/YyrfHRi8aFtj5BJoQZDRikUr9l6', '2026-08-29 12:48:45.93245+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:48:46.429301+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "013447b6-0b04-4218-b6b6-964cc16b3e6c", "name": "Auth Test User", "email": "auth_test_1788007722731@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 12:48:45.890038+00', '2026-08-29 12:48:46.437249+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '76c983b0-c405-4f10-9682-8482f8863936', 'authenticated', 'authenticated', 'auth_test_1788004508901@example.com', '$2a$10$A2SnYiaxN26YBcCuqWVeNecBOdrqNPbeTgHPUv4odMSMd7.2gnAte', '2026-08-29 11:55:14.598476+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:55:15.014224+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "76c983b0-c405-4f10-9682-8482f8863936", "name": "Auth Test User", "email": "auth_test_1788004508901@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:55:10.84267+00', '2026-08-29 11:55:15.696094+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '200c4adc-688d-49e3-be53-6fa7a2dada9a', 'authenticated', 'authenticated', 'admin_1788004504100@example.com', '$2a$10$pNyb48T7EQhNTWxgALqTXewv/4oqfA6PVoAE5F.e7mbYxYcJ14X4K', '2026-08-29 11:55:14.572431+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:55:19.159163+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 11:55:10.866903+00', '2026-08-29 11:55:19.28801+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0422e297-2c09-4520-a57c-cf70ad493fcf', 'authenticated', 'authenticated', 'auth_test_1788004159038@example.com', '$2a$10$DGV2.dwgkyKaxQ/llKqfueOnfjmIAYSc1tMbDC6p.IS1fD/mpoGky', '2026-08-29 11:49:22.759931+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 11:49:26.056196+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "0422e297-2c09-4520-a57c-cf70ad493fcf", "name": "Auth Test User", "email": "auth_test_1788004159038@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 11:49:22.567565+00', '2026-08-29 11:49:26.085028+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f79bc07d-b968-4846-8991-ac3824bd89b2', 'authenticated', 'authenticated', 'auth_test_1788007957157@example.com', '$2a$10$yC.qCakJKlVOpa7buon0/ulZSwpW2SENEyqXmuHR2i99uBHb.dR.W', '2026-08-29 12:52:40.32391+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:52:42.169267+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "f79bc07d-b968-4846-8991-ac3824bd89b2", "name": "Auth Test User", "email": "auth_test_1788007957157@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 12:52:39.929769+00', '2026-08-29 12:52:42.190385+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0169c76d-ff68-48f5-9330-ac3fa8d02bb8', 'authenticated', 'authenticated', 'admin_1788004947259@example.com', '$2a$10$5RI8TSN.YckPB5USgrwUM.QzSVTrDDZ6Tzs5NSzcUSTRae3J13kOe', '2026-08-29 12:02:32.638735+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:02:43.344033+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:02:32.44015+00', '2026-08-29 12:02:43.424309+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0109cb11-8c24-4581-92a0-fdbaab70187f', 'authenticated', 'authenticated', 'auth_test_1788007400631@example.com', '$2a$10$fVkSZ7xuRJNxClvAnK86UOtRcLjdYeS9Cc8UGTkIp.QBHrV5IBylS', '2026-08-29 12:43:22.636079+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:43:27.138529+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "0109cb11-8c24-4581-92a0-fdbaab70187f", "name": "Auth Test User", "email": "auth_test_1788007400631@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 12:43:22.072854+00', '2026-08-29 12:43:27.221266+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f3edeb9f-9878-4723-8fa7-36a4d34d345a', 'authenticated', 'authenticated', 'admin_1788007397171@example.com', '$2a$10$YzV.oBAx/W0lG.JKKS9UJO.VuQxUxsnsLLFu.L2TncD26MvqT4oa.', '2026-08-29 12:43:21.553689+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:43:27.340846+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:43:20.584631+00', '2026-08-29 12:43:27.35673+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '7bb18ae6-9a37-48ac-9831-7484677ecdc1', 'authenticated', 'authenticated', 'admin_1788007716727@example.com', '$2a$10$EcP5jiXEq4fkwoOQSoViB.iXlQLj8ixBI5/suKL2.9bWNnWywB0se', '2026-08-29 12:48:39.611333+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:48:45.95277+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:48:39.529496+00', '2026-08-29 12:48:46.002764+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '556dbc04-7a39-4382-9e1d-dd20a4add384', 'authenticated', 'authenticated', 'admin_1788007838435@example.com', '$2a$10$24vSJCQuzJkh3NphRpZOkOvTVct8IFF6ZADBAeMgcTiFaDRiNLWFO', '2026-08-29 12:50:40.015467+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:50:45.511145+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:50:39.944358+00', '2026-08-29 12:50:45.555433+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '56cc2643-0c3d-4561-ab19-52733523e9cd', 'authenticated', 'authenticated', 'admin_1788007953109@example.com', '$2a$10$3A4MZoalCRixAE6wz7mcWuO70OyPu71WXmlX/k2cSmL0Ho9vDfENO', '2026-08-29 12:52:36.194816+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:52:42.231732+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:52:35.843503+00', '2026-08-29 12:52:42.243333+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '92b50b56-264a-4d12-9c60-f461c7fe5d62', 'authenticated', 'authenticated', 'admin_1788008156036@example.com', '$2a$10$t7q.7sd587.WerlcPkv67OPEhfxyVL00D0dp.FQ9n76O0bVY20HDG', '2026-08-29 12:55:57.666863+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:56:01.96521+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:55:57.556749+00', '2026-08-29 12:56:02.330881+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '235ebf98-780e-4158-abda-436d2d876510', 'authenticated', 'authenticated', 'favazmk12@gmail.com', '$2a$10$NrHVHZjcRB6P0eEklaOEkeP/1F4wzs5bHHxlk1qZOk2Cqs0rPWG4.', '2026-09-01 07:25:53.517157+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-01 07:25:53.719904+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "235ebf98-780e-4158-abda-436d2d876510", "name": "Favaz Mk", "email": "favazmk12@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-09-01 07:25:53.478542+00', '2026-09-01 07:25:53.723707+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd48eb217-ebc8-4b28-a981-aee75cad7a66', 'authenticated', 'authenticated', 'auth_test_1788008161739@example.com', '$2a$10$cwN/sCqhXrEv8zr.AeZjGO66sj8jEmKNMN67d/4WPJv4aQbPq8BLu', '2026-08-29 12:56:03.133453+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:56:03.62759+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "d48eb217-ebc8-4b28-a981-aee75cad7a66", "name": "Auth Test User", "email": "auth_test_1788008161739@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 12:56:03.091338+00', '2026-08-29 12:56:03.643141+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c7f08ac4-273e-484b-a96a-49c136bcdbf5', 'authenticated', 'authenticated', 'admin@store.com', '$2a$10$dx8KuKcuqgw/8BxU7P4jv.jhT1/k9fKg3ukPfV2lqb9Z2Oc1k3O82', '2026-09-01 07:21:01.031163+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-01 07:21:01.285407+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c7f08ac4-273e-484b-a96a-49c136bcdbf5", "name": "test", "email": "admin@store.com", "email_verified": true, "phone_verified": false}', NULL, '2026-09-01 07:21:00.955107+00', '2026-09-01 07:21:01.289125+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '92346415-7367-4a11-96de-faf84f00f0f8', 'authenticated', 'authenticated', 'admin_1788008276045@example.com', '$2a$10$AKaJKif0TgiQiSqG9fniYeiXaN3XHEsIUKThArO5EnVJhi6zmOcqC', '2026-08-29 12:57:58.248528+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:58:06.449981+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 12:57:58.148513+00', '2026-08-29 12:58:06.486399+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '64f314bd-1e50-468d-a4fd-bd9ea1a381ab', 'authenticated', 'authenticated', 'admin_1788008601483@example.com', '$2a$10$BRp1UWoPat6hs3t3Nz.h5eTDI8yQIWB3Qdt58lNLGWmJ0x358E.Ru', '2026-08-29 13:03:23.620889+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 13:03:31.509196+00', '{"provider": "email", "providers": ["email"]}', '{"name": "E2E Admin", "email_verified": true}', NULL, '2026-08-29 13:03:23.533797+00', '2026-08-29 13:03:31.560599+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '58503c92-9399-4a82-955b-25724a3f4cbc', 'authenticated', 'authenticated', 'auth_test_1788008283935@example.com', '$2a$10$Gnub9KqFi4j9cfIUrg1q8.GiLor2wXcQfX257tSl8bKdfb7a/rQE.', '2026-08-29 12:58:06.369046+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 12:58:13.504987+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "58503c92-9399-4a82-955b-25724a3f4cbc", "name": "Auth Test User", "email": "auth_test_1788008283935@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 12:58:06.301269+00', '2026-08-29 12:58:13.557216+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1d478337-7633-4a29-892c-c152986f0d00', 'authenticated', 'authenticated', 'auth_test_1788008606635@example.com', '$2a$10$nQdm4Zj8LF1YxJ37FzZyF.CbEQswh7msLXR0HrDRFOXOLRkyMJUcC', '2026-08-29 13:03:29.253186+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-29 13:03:32.984065+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "1d478337-7633-4a29-892c-c152986f0d00", "name": "Auth Test User", "email": "auth_test_1788008606635@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-08-29 13:03:28.970855+00', '2026-08-29 13:03:33.023371+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', '8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', '{"sub": "8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5", "email": "customer_a_1788001697562@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:08:21.288857+00', '2026-08-29 11:08:21.289141+00', '2026-08-29 11:08:21.289141+00', 'a7f0a04d-60ac-4f00-96a3-75bd60b68191'),
	('63058e8f-b5b9-426e-a2ed-8e20a44f3b8e', '63058e8f-b5b9-426e-a2ed-8e20a44f3b8e', '{"sub": "63058e8f-b5b9-426e-a2ed-8e20a44f3b8e", "email": "customer_b_1788001697562@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:08:21.787713+00', '2026-08-29 11:08:21.787767+00', '2026-08-29 11:08:21.787767+00', '49af1214-3bf2-4275-8679-2ee4f931a9b0'),
	('83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', '83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', '{"sub": "83681d1e-16f3-4b9a-9bd2-83d0ea9204a3", "email": "customer_a_1788001739992@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:09:00.380942+00', '2026-08-29 11:09:00.381015+00', '2026-08-29 11:09:00.381015+00', 'db368266-6b28-4da5-a617-b2718658562d'),
	('93218371-8eef-4196-93d4-c22368939498', '93218371-8eef-4196-93d4-c22368939498', '{"sub": "93218371-8eef-4196-93d4-c22368939498", "email": "customer_b_1788001739992@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:09:00.709719+00', '2026-08-29 11:09:00.709772+00', '2026-08-29 11:09:00.709772+00', '82ac8bd5-e7b7-4195-b603-b5969e9b1d81'),
	('a14e16eb-4f84-4572-9828-8efeebf9fcdf', 'a14e16eb-4f84-4572-9828-8efeebf9fcdf', '{"sub": "a14e16eb-4f84-4572-9828-8efeebf9fcdf", "email": "admin_1788002847865@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:27:31.500638+00', '2026-08-29 11:27:31.50121+00', '2026-08-29 11:27:31.50121+00', '4f9f2d62-7e44-44ac-b18f-870123e77e0d'),
	('71ae826c-a97b-400c-91f6-b86b70e064cd', '71ae826c-a97b-400c-91f6-b86b70e064cd', '{"sub": "71ae826c-a97b-400c-91f6-b86b70e064cd", "email": "admin_1788003006467@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:30:09.437864+00', '2026-08-29 11:30:09.438458+00', '2026-08-29 11:30:09.438458+00', '8f16fb07-951e-46f3-9a38-105888025083'),
	('a3d201a9-d49e-4106-a881-228e639f0f0d', 'a3d201a9-d49e-4106-a881-228e639f0f0d', '{"sub": "a3d201a9-d49e-4106-a881-228e639f0f0d", "name": "Auth Test User", "email": "auth_test_1788003019853@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:30:29.823289+00', '2026-08-29 11:30:29.889488+00', '2026-08-29 11:30:29.889488+00', '0148999a-9ea8-4904-8935-6b8d60e24e1b'),
	('bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e', 'bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e', '{"sub": "bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e", "email": "admin_1788003233850@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:33:55.684786+00', '2026-08-29 11:33:55.685019+00', '2026-08-29 11:33:55.685019+00', '69784e95-c961-4d30-be53-c272120fb054'),
	('f4043e11-b497-48b8-98a3-5bc51315171f', 'f4043e11-b497-48b8-98a3-5bc51315171f', '{"sub": "f4043e11-b497-48b8-98a3-5bc51315171f", "name": "Auth Test User", "email": "auth_test_1788003244078@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:34:16.414763+00', '2026-08-29 11:34:16.41496+00', '2026-08-29 11:34:16.41496+00', 'ee551225-2a9a-4923-acf5-2d7ad5d4c0c1'),
	('e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8', 'e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8', '{"sub": "e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8", "email": "admin_1788003344804@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:35:46.18954+00', '2026-08-29 11:35:46.189634+00', '2026-08-29 11:35:46.189634+00', '85b77b4e-707f-4e7d-bc6d-82c86c77027d'),
	('c121fa79-47f2-4556-8ef5-feea4d788087', 'c121fa79-47f2-4556-8ef5-feea4d788087', '{"sub": "c121fa79-47f2-4556-8ef5-feea4d788087", "email": "admin_1788003489577@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:38:12.39864+00', '2026-08-29 11:38:12.398796+00', '2026-08-29 11:38:12.398796+00', '64f54c88-2d8d-4b38-bcd5-f0bc2b20eb2f'),
	('26fba916-be07-4aa6-866a-edcf948655bc', '26fba916-be07-4aa6-866a-edcf948655bc', '{"sub": "26fba916-be07-4aa6-866a-edcf948655bc", "name": "Auth Test User", "email": "auth_test_1788003505270@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:38:28.457237+00', '2026-08-29 11:38:28.457413+00', '2026-08-29 11:38:28.457413+00', 'eb7efec4-d21c-4272-8ec4-c3c3ba667edc'),
	('130a8ccf-30ba-441d-9fdd-c8833a398f09', '130a8ccf-30ba-441d-9fdd-c8833a398f09', '{"sub": "130a8ccf-30ba-441d-9fdd-c8833a398f09", "email": "admin_1788003775181@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:43:04.251506+00', '2026-08-29 11:43:04.251588+00', '2026-08-29 11:43:04.251588+00', 'a7d65c0d-499a-46b6-9ea5-ab6b63876b6b'),
	('c23b0c3c-84bf-489e-b885-0d555e54a4cf', 'c23b0c3c-84bf-489e-b885-0d555e54a4cf', '{"sub": "c23b0c3c-84bf-489e-b885-0d555e54a4cf", "name": "Auth Test User", "email": "auth_test_1788003799276@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:43:25.520637+00', '2026-08-29 11:43:25.526198+00', '2026-08-29 11:43:25.526198+00', '35f95158-8d47-436f-b6cf-3def4df12937'),
	('2d1808c5-695b-4b35-80aa-3002a26daa25', '2d1808c5-695b-4b35-80aa-3002a26daa25', '{"sub": "2d1808c5-695b-4b35-80aa-3002a26daa25", "email": "admin_1788004005001@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:46:53.275587+00', '2026-08-29 11:46:53.2757+00', '2026-08-29 11:46:53.2757+00', '901b82fc-6966-4a01-890c-7be9c375d7a1'),
	('f746e1c1-8a36-4ff5-9c93-68b36a1494c7', 'f746e1c1-8a36-4ff5-9c93-68b36a1494c7', '{"sub": "f746e1c1-8a36-4ff5-9c93-68b36a1494c7", "name": "Auth Test User", "email": "auth_test_1788004009351@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:46:53.332004+00', '2026-08-29 11:46:53.332245+00', '2026-08-29 11:46:53.332245+00', '58810fb8-6d59-40e6-b49c-55ca7871f4c2'),
	('0422e297-2c09-4520-a57c-cf70ad493fcf', '0422e297-2c09-4520-a57c-cf70ad493fcf', '{"sub": "0422e297-2c09-4520-a57c-cf70ad493fcf", "name": "Auth Test User", "email": "auth_test_1788004159038@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:49:22.661947+00', '2026-08-29 11:49:22.66204+00', '2026-08-29 11:49:22.66204+00', '55975da8-c642-4b75-9a62-5de833277154'),
	('200c4adc-688d-49e3-be53-6fa7a2dada9a', '200c4adc-688d-49e3-be53-6fa7a2dada9a', '{"sub": "200c4adc-688d-49e3-be53-6fa7a2dada9a", "email": "admin_1788004504100@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:55:14.365723+00', '2026-08-29 11:55:14.372505+00', '2026-08-29 11:55:14.372505+00', 'ad99a8f4-2163-4ade-a4c9-084b9250219e'),
	('76c983b0-c405-4f10-9682-8482f8863936', '76c983b0-c405-4f10-9682-8482f8863936', '{"sub": "76c983b0-c405-4f10-9682-8482f8863936", "name": "Auth Test User", "email": "auth_test_1788004508901@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 11:55:14.498707+00', '2026-08-29 11:55:14.498787+00', '2026-08-29 11:55:14.498787+00', '302cdea3-e2d3-49aa-8dce-595706c32834'),
	('0169c76d-ff68-48f5-9330-ac3fa8d02bb8', '0169c76d-ff68-48f5-9330-ac3fa8d02bb8', '{"sub": "0169c76d-ff68-48f5-9330-ac3fa8d02bb8", "email": "admin_1788004947259@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:02:32.511771+00', '2026-08-29 12:02:32.512728+00', '2026-08-29 12:02:32.512728+00', '0e89dab0-a2d9-460b-8867-8d8be9c1b0b5'),
	('f3edeb9f-9878-4723-8fa7-36a4d34d345a', 'f3edeb9f-9878-4723-8fa7-36a4d34d345a', '{"sub": "f3edeb9f-9878-4723-8fa7-36a4d34d345a", "email": "admin_1788007397171@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:43:21.281127+00', '2026-08-29 12:43:21.281225+00', '2026-08-29 12:43:21.281225+00', '93e60c0c-2b2b-4475-9aea-eb31c2be7e87'),
	('0109cb11-8c24-4581-92a0-fdbaab70187f', '0109cb11-8c24-4581-92a0-fdbaab70187f', '{"sub": "0109cb11-8c24-4581-92a0-fdbaab70187f", "name": "Auth Test User", "email": "auth_test_1788007400631@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:43:22.448646+00', '2026-08-29 12:43:22.473798+00', '2026-08-29 12:43:22.473798+00', 'fcdd3d36-be3a-4431-ae2d-966260c44326'),
	('7bb18ae6-9a37-48ac-9831-7484677ecdc1', '7bb18ae6-9a37-48ac-9831-7484677ecdc1', '{"sub": "7bb18ae6-9a37-48ac-9831-7484677ecdc1", "email": "admin_1788007716727@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:48:39.576134+00', '2026-08-29 12:48:39.576272+00', '2026-08-29 12:48:39.576272+00', '531d7a55-98bc-45c9-a68b-ca8ec1c0186b'),
	('013447b6-0b04-4218-b6b6-964cc16b3e6c', '013447b6-0b04-4218-b6b6-964cc16b3e6c', '{"sub": "013447b6-0b04-4218-b6b6-964cc16b3e6c", "name": "Auth Test User", "email": "auth_test_1788007722731@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:48:45.913441+00', '2026-08-29 12:48:45.913557+00', '2026-08-29 12:48:45.913557+00', '2b4e9e09-332f-45b1-8674-311ac418f668'),
	('556dbc04-7a39-4382-9e1d-dd20a4add384', '556dbc04-7a39-4382-9e1d-dd20a4add384', '{"sub": "556dbc04-7a39-4382-9e1d-dd20a4add384", "email": "admin_1788007838435@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:50:39.981299+00', '2026-08-29 12:50:39.982277+00', '2026-08-29 12:50:39.982277+00', '7b39556d-c611-4e42-972d-c07ea4738194'),
	('b258f487-cf2d-499d-a047-7d55715a0b4e', 'b258f487-cf2d-499d-a047-7d55715a0b4e', '{"sub": "b258f487-cf2d-499d-a047-7d55715a0b4e", "name": "Auth Test User", "email": "auth_test_1788007841163@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:50:49.080686+00', '2026-08-29 12:50:49.080772+00', '2026-08-29 12:50:49.080772+00', '4ab8aaf2-d178-4fed-93ff-6d3b1bbeefc8'),
	('56cc2643-0c3d-4561-ab19-52733523e9cd', '56cc2643-0c3d-4561-ab19-52733523e9cd', '{"sub": "56cc2643-0c3d-4561-ab19-52733523e9cd", "email": "admin_1788007953109@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:52:36.134115+00', '2026-08-29 12:52:36.134249+00', '2026-08-29 12:52:36.134249+00', '24d51b5d-f1be-4de9-8787-227bd4625f08'),
	('f79bc07d-b968-4846-8991-ac3824bd89b2', 'f79bc07d-b968-4846-8991-ac3824bd89b2', '{"sub": "f79bc07d-b968-4846-8991-ac3824bd89b2", "name": "Auth Test User", "email": "auth_test_1788007957157@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:52:40.175079+00', '2026-08-29 12:52:40.175192+00', '2026-08-29 12:52:40.175192+00', 'a06398e8-4cc9-488d-9c81-cc526bdadac0'),
	('92b50b56-264a-4d12-9c60-f461c7fe5d62', '92b50b56-264a-4d12-9c60-f461c7fe5d62', '{"sub": "92b50b56-264a-4d12-9c60-f461c7fe5d62", "email": "admin_1788008156036@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:55:57.620958+00', '2026-08-29 12:55:57.621608+00', '2026-08-29 12:55:57.621608+00', 'f56a79ad-9f35-4fed-ac88-c6f7ffbc3deb'),
	('d48eb217-ebc8-4b28-a981-aee75cad7a66', 'd48eb217-ebc8-4b28-a981-aee75cad7a66', '{"sub": "d48eb217-ebc8-4b28-a981-aee75cad7a66", "name": "Auth Test User", "email": "auth_test_1788008161739@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:56:03.11764+00', '2026-08-29 12:56:03.117769+00', '2026-08-29 12:56:03.117769+00', '160ca8f5-c747-4a6c-92ec-f8ce4c0d1d91'),
	('92346415-7367-4a11-96de-faf84f00f0f8', '92346415-7367-4a11-96de-faf84f00f0f8', '{"sub": "92346415-7367-4a11-96de-faf84f00f0f8", "email": "admin_1788008276045@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:57:58.196871+00', '2026-08-29 12:57:58.196957+00', '2026-08-29 12:57:58.196957+00', '9f4d4247-5a0d-4654-a576-90aa9812764e'),
	('58503c92-9399-4a82-955b-25724a3f4cbc', '58503c92-9399-4a82-955b-25724a3f4cbc', '{"sub": "58503c92-9399-4a82-955b-25724a3f4cbc", "name": "Auth Test User", "email": "auth_test_1788008283935@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 12:58:06.340912+00', '2026-08-29 12:58:06.341044+00', '2026-08-29 12:58:06.341044+00', '7a97c3ca-fd0c-4694-bcb2-cd1768f0334b'),
	('64f314bd-1e50-468d-a4fd-bd9ea1a381ab', '64f314bd-1e50-468d-a4fd-bd9ea1a381ab', '{"sub": "64f314bd-1e50-468d-a4fd-bd9ea1a381ab", "email": "admin_1788008601483@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 13:03:23.583588+00', '2026-08-29 13:03:23.584226+00', '2026-08-29 13:03:23.584226+00', '7039e1b7-43f2-4b54-9c66-994a01c0cba6'),
	('1d478337-7633-4a29-892c-c152986f0d00', '1d478337-7633-4a29-892c-c152986f0d00', '{"sub": "1d478337-7633-4a29-892c-c152986f0d00", "name": "Auth Test User", "email": "auth_test_1788008606635@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-29 13:03:29.199419+00', '2026-08-29 13:03:29.199554+00', '2026-08-29 13:03:29.199554+00', 'a98a0fb8-ac7d-42ea-8810-bbb735047467'),
	('c7f08ac4-273e-484b-a96a-49c136bcdbf5', 'c7f08ac4-273e-484b-a96a-49c136bcdbf5', '{"sub": "c7f08ac4-273e-484b-a96a-49c136bcdbf5", "name": "test", "email": "admin@store.com", "email_verified": false, "phone_verified": false}', 'email', '2026-09-01 07:21:01.009+00', '2026-09-01 07:21:01.00904+00', '2026-09-01 07:21:01.00904+00', '98a5dfa3-8285-4593-912e-a01667f58f1a'),
	('235ebf98-780e-4158-abda-436d2d876510', '235ebf98-780e-4158-abda-436d2d876510', '{"sub": "235ebf98-780e-4158-abda-436d2d876510", "name": "Favaz Mk", "email": "favazmk12@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-09-01 07:25:53.503738+00', '2026-09-01 07:25:53.503778+00', '2026-09-01 07:25:53.503778+00', '5e0ff0fa-3075-46a3-845a-60548ecdcc1c');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('fd4eb46f-38ce-4b9e-b2c7-82c4b6d2abb1', '8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', '2026-08-29 11:08:22.303236+00', '2026-08-29 11:08:22.303236+00', NULL, 'aal1', NULL, NULL, 'node', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('748eb0e4-8194-46ff-8c32-18eecd43874e', '63058e8f-b5b9-426e-a2ed-8e20a44f3b8e', '2026-08-29 11:08:22.715362+00', '2026-08-29 11:08:22.715362+00', NULL, 'aal1', NULL, NULL, 'node', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('71e4e4ba-e286-40b7-a8e1-b6b3e3d81945', '83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', '2026-08-29 11:09:00.919755+00', '2026-08-29 11:09:00.919755+00', NULL, 'aal1', NULL, NULL, 'node', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('973a15b1-891c-4357-992c-fa0f496497fe', '93218371-8eef-4196-93d4-c22368939498', '2026-08-29 11:09:01.050249+00', '2026-08-29 11:09:01.050249+00', NULL, 'aal1', NULL, NULL, 'node', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('db9ac704-beeb-4df3-8e9f-975b03183f8c', '71ae826c-a97b-400c-91f6-b86b70e064cd', '2026-08-29 11:30:30.518064+00', '2026-08-29 11:30:30.518064+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('05c34383-c23b-483f-9794-ae2d959bda41', 'a3d201a9-d49e-4106-a881-228e639f0f0d', '2026-08-29 11:30:30.97709+00', '2026-08-29 11:30:30.97709+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('c7636702-6108-4345-978c-e1d30fd8ffdd', 'bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e', '2026-08-29 11:34:16.240994+00', '2026-08-29 11:34:16.240994+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('d0c2c4e7-0795-44ab-9c79-2f06fae6f954', 'f4043e11-b497-48b8-98a3-5bc51315171f', '2026-08-29 11:34:17.313609+00', '2026-08-29 11:34:17.313609+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('701d159a-2f41-4c67-94c1-59ecf81d2edd', 'e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8', '2026-08-29 11:35:55.317057+00', '2026-08-29 11:35:55.317057+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('8f1d2183-d21f-4c07-bbeb-1fce5f95a37d', 'c121fa79-47f2-4556-8ef5-feea4d788087', '2026-08-29 11:38:28.559669+00', '2026-08-29 11:38:28.559669+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('153f7284-a8db-4467-85f7-38de5df95ad5', '26fba916-be07-4aa6-866a-edcf948655bc', '2026-08-29 11:38:28.559639+00', '2026-08-29 11:38:28.559639+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('944a2717-81f1-4b4e-879a-1bde3f07e925', '26fba916-be07-4aa6-866a-edcf948655bc', '2026-08-29 11:38:45.136855+00', '2026-08-29 11:38:45.136855+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('b8a97b69-62a5-4431-b24f-4abbea9c5554', 'c23b0c3c-84bf-489e-b885-0d555e54a4cf', '2026-08-29 11:43:25.62969+00', '2026-08-29 11:43:25.62969+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('941a8bea-69b4-4bab-b3f7-5751fa8a805e', '130a8ccf-30ba-441d-9fdd-c8833a398f09', '2026-08-29 11:43:25.86999+00', '2026-08-29 11:43:25.86999+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('8a81790d-caac-4e70-be58-af0fef40f98f', 'c23b0c3c-84bf-489e-b885-0d555e54a4cf', '2026-08-29 11:43:27.813433+00', '2026-08-29 11:43:27.813433+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('3ab70370-d6f3-45ac-95c4-da2312ce0b73', 'f746e1c1-8a36-4ff5-9c93-68b36a1494c7', '2026-08-29 11:46:53.52039+00', '2026-08-29 11:46:53.52039+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('ae9f4277-c46e-4ab2-b03a-77ff0bcf834b', '2d1808c5-695b-4b35-80aa-3002a26daa25', '2026-08-29 11:47:02.354372+00', '2026-08-29 11:47:02.354372+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('89b2109d-ad24-4185-bfc8-8b90c114402d', 'f746e1c1-8a36-4ff5-9c93-68b36a1494c7', '2026-08-29 11:47:05.893788+00', '2026-08-29 11:47:05.893788+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('cd742a51-bb9a-4bf9-9bcc-97a7c0c3f8a4', '0422e297-2c09-4520-a57c-cf70ad493fcf', '2026-08-29 11:49:22.961164+00', '2026-08-29 11:49:22.961164+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('6c856f7b-64a2-4b87-a7c5-7421c7aaee71', '0422e297-2c09-4520-a57c-cf70ad493fcf', '2026-08-29 11:49:26.056382+00', '2026-08-29 11:49:26.056382+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('21655cf0-7cf9-4a5f-a951-2d42fdfad58a', '76c983b0-c405-4f10-9682-8482f8863936', '2026-08-29 11:55:15.049807+00', '2026-08-29 11:55:15.049807+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('8e677f84-19b4-43bc-bd55-2094f030e851', '200c4adc-688d-49e3-be53-6fa7a2dada9a', '2026-08-29 11:55:19.15937+00', '2026-08-29 11:55:19.15937+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('1e46591e-f7f3-4729-af50-61e1f226edf7', '0169c76d-ff68-48f5-9330-ac3fa8d02bb8', '2026-08-29 12:02:43.349836+00', '2026-08-29 12:02:43.349836+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('532e8949-4bb2-4a21-a3cf-15933b578ba6', '0109cb11-8c24-4581-92a0-fdbaab70187f', '2026-08-29 12:43:22.692345+00', '2026-08-29 12:43:22.692345+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('67c6b134-ddd5-4be8-b623-e1f4bce17cc2', '0109cb11-8c24-4581-92a0-fdbaab70187f', '2026-08-29 12:43:27.138664+00', '2026-08-29 12:43:27.138664+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('c2b9793b-e4c3-4cc6-b629-97de4d793416', 'f3edeb9f-9878-4723-8fa7-36a4d34d345a', '2026-08-29 12:43:27.350155+00', '2026-08-29 12:43:27.350155+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('9e967142-4440-4d97-adc6-295ff5ab164c', '7bb18ae6-9a37-48ac-9831-7484677ecdc1', '2026-08-29 12:48:45.95803+00', '2026-08-29 12:48:45.95803+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('1e83e567-1b41-45dc-a614-d09e51d60f7a', '013447b6-0b04-4218-b6b6-964cc16b3e6c', '2026-08-29 12:48:45.970818+00', '2026-08-29 12:48:45.970818+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('b5eb9e0c-339d-4743-aca2-888eeea2232b', '013447b6-0b04-4218-b6b6-964cc16b3e6c', '2026-08-29 12:48:46.429447+00', '2026-08-29 12:48:46.429447+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('5e9e0e6a-7872-415a-8936-fac1b967c64f', '556dbc04-7a39-4382-9e1d-dd20a4add384', '2026-08-29 12:50:45.516279+00', '2026-08-29 12:50:45.516279+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('0c66610d-b249-4628-9c00-f962420d181a', 'b258f487-cf2d-499d-a047-7d55715a0b4e', '2026-08-29 12:50:49.224182+00', '2026-08-29 12:50:49.224182+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('ea270730-2a54-4f47-b17d-ef4de912ede6', 'b258f487-cf2d-499d-a047-7d55715a0b4e', '2026-08-29 12:50:50.903437+00', '2026-08-29 12:50:50.903437+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('c2f0dcf7-d21c-4ed7-ac5e-840884d84105', 'f79bc07d-b968-4846-8991-ac3824bd89b2', '2026-08-29 12:52:40.625743+00', '2026-08-29 12:52:40.625743+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('07ac3e2e-44a0-4d84-b723-0dd88f053d74', 'f79bc07d-b968-4846-8991-ac3824bd89b2', '2026-08-29 12:52:42.169589+00', '2026-08-29 12:52:42.169589+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('2c5d8e58-dc38-46be-8a20-39d80f7b63ad', '56cc2643-0c3d-4561-ab19-52733523e9cd', '2026-08-29 12:52:42.231881+00', '2026-08-29 12:52:42.231881+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('1aabddcc-a098-44e6-aef6-deee8bcaade6', '92b50b56-264a-4d12-9c60-f461c7fe5d62', '2026-08-29 12:56:01.968708+00', '2026-08-29 12:56:01.968708+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('29328107-44a7-48d9-a943-c306188699b5', 'd48eb217-ebc8-4b28-a981-aee75cad7a66', '2026-08-29 12:56:03.177785+00', '2026-08-29 12:56:03.177785+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('4a5bdf42-a498-47dd-9980-f2707dcfb08c', 'd48eb217-ebc8-4b28-a981-aee75cad7a66', '2026-08-29 12:56:03.627812+00', '2026-08-29 12:56:03.627812+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('b7ecd9e0-b30c-4191-9b36-7f24f45b90fc', '92346415-7367-4a11-96de-faf84f00f0f8', '2026-08-29 12:58:06.455579+00', '2026-08-29 12:58:06.455579+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('9e455616-b2ed-48b3-968f-94f88c3bfddf', '58503c92-9399-4a82-955b-25724a3f4cbc', '2026-08-29 12:58:06.491931+00', '2026-08-29 12:58:06.491931+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('91a699fd-2ef1-4ad5-afd8-7837d200612c', '58503c92-9399-4a82-955b-25724a3f4cbc', '2026-08-29 12:58:13.507961+00', '2026-08-29 12:58:13.507961+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('8b382e63-f53f-4355-b22e-2cb724edea15', '1d478337-7633-4a29-892c-c152986f0d00', '2026-08-29 13:03:29.367101+00', '2026-08-29 13:03:29.367101+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('2f479571-bc49-4fed-bf9b-d11f6d2e8506', '64f314bd-1e50-468d-a4fd-bd9ea1a381ab', '2026-08-29 13:03:31.509622+00', '2026-08-29 13:03:31.509622+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('ded92942-b8c0-4f1f-a27e-3253ccfd035c', '1d478337-7633-4a29-892c-c152986f0d00', '2026-08-29 13:03:32.984198+00', '2026-08-29 13:03:32.984198+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('49cb56e8-4746-40cd-961c-fb605dac67e8', 'c7f08ac4-273e-484b-a96a-49c136bcdbf5', '2026-09-01 07:21:01.066965+00', '2026-09-01 07:21:01.066965+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('34899a7f-6020-4f19-aca4-f5dbb99b12d6', 'c7f08ac4-273e-484b-a96a-49c136bcdbf5', '2026-09-01 07:21:01.285504+00', '2026-09-01 07:21:01.285504+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('3f7e77ef-fd76-4204-b226-ad4ed220a02c', '235ebf98-780e-4158-abda-436d2d876510', '2026-09-01 07:25:53.539373+00', '2026-09-01 07:25:53.539373+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('88fa9a88-8d60-407c-9361-7d2769f63049', '235ebf98-780e-4158-abda-436d2d876510', '2026-09-01 07:25:53.720013+00', '2026-09-01 07:25:53.720013+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '172.19.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('fd4eb46f-38ce-4b9e-b2c7-82c4b6d2abb1', '2026-08-29 11:08:22.43871+00', '2026-08-29 11:08:22.43871+00', 'password', 'd07d2ddf-42ea-470f-b132-b49f3cd9ad4f'),
	('748eb0e4-8194-46ff-8c32-18eecd43874e', '2026-08-29 11:08:22.72549+00', '2026-08-29 11:08:22.72549+00', 'password', 'bb5087a3-6155-44d5-9548-3169d1bb25ec'),
	('71e4e4ba-e286-40b7-a8e1-b6b3e3d81945', '2026-08-29 11:09:00.92607+00', '2026-08-29 11:09:00.92607+00', 'password', 'afef603b-0885-467e-9a3b-904e79339e1b'),
	('973a15b1-891c-4357-992c-fa0f496497fe', '2026-08-29 11:09:01.053908+00', '2026-08-29 11:09:01.053908+00', 'password', '939b2ea5-5197-4323-a566-81f3e29a6615'),
	('05c34383-c23b-483f-9794-ae2d959bda41', '2026-08-29 11:30:31.573642+00', '2026-08-29 11:30:31.573642+00', 'password', 'db25cfac-6688-4e66-b1b4-a96d94c6808d'),
	('db9ac704-beeb-4df3-8e9f-975b03183f8c', '2026-08-29 11:30:31.607135+00', '2026-08-29 11:30:31.607135+00', 'password', '431d3127-28ce-47e8-b471-63838c67284c'),
	('c7636702-6108-4345-978c-e1d30fd8ffdd', '2026-08-29 11:34:16.594834+00', '2026-08-29 11:34:16.594834+00', 'password', 'ff5a30d9-7dd5-4408-a8d4-7eff75aa9f83'),
	('d0c2c4e7-0795-44ab-9c79-2f06fae6f954', '2026-08-29 11:34:17.45332+00', '2026-08-29 11:34:17.45332+00', 'password', 'c488d64f-7bc9-4fa6-8501-677580e565cf'),
	('701d159a-2f41-4c67-94c1-59ecf81d2edd', '2026-08-29 11:35:55.478619+00', '2026-08-29 11:35:55.478619+00', 'password', '89e17d30-c263-41ee-b299-07e115d74c64'),
	('8f1d2183-d21f-4c07-bbeb-1fce5f95a37d', '2026-08-29 11:38:28.674079+00', '2026-08-29 11:38:28.674079+00', 'password', 'a6fa4540-f6ea-4fc3-a70c-329419273c50'),
	('153f7284-a8db-4467-85f7-38de5df95ad5', '2026-08-29 11:38:28.671144+00', '2026-08-29 11:38:28.671144+00', 'password', 'd8511d3f-e35e-44e1-b37b-1570cfda7077'),
	('944a2717-81f1-4b4e-879a-1bde3f07e925', '2026-08-29 11:38:47.406129+00', '2026-08-29 11:38:47.406129+00', 'password', 'f52cf017-3d7a-43a6-add0-d9970dbf97a2'),
	('b8a97b69-62a5-4431-b24f-4abbea9c5554', '2026-08-29 11:43:25.715107+00', '2026-08-29 11:43:25.715107+00', 'password', '47762b55-dc1d-4378-805c-8517b4194b1c'),
	('941a8bea-69b4-4bab-b3f7-5751fa8a805e', '2026-08-29 11:43:25.883377+00', '2026-08-29 11:43:25.883377+00', 'password', '320a3955-abaa-4ab2-b2de-324a66e26e8f'),
	('8a81790d-caac-4e70-be58-af0fef40f98f', '2026-08-29 11:43:27.826837+00', '2026-08-29 11:43:27.826837+00', 'password', 'e38ae49b-c6b1-40e2-b339-1832e5733946'),
	('3ab70370-d6f3-45ac-95c4-da2312ce0b73', '2026-08-29 11:46:54.303759+00', '2026-08-29 11:46:54.303759+00', 'password', 'c2873b0e-7aa5-4631-a9dc-d05d7bdada0c'),
	('ae9f4277-c46e-4ab2-b03a-77ff0bcf834b', '2026-08-29 11:47:02.410219+00', '2026-08-29 11:47:02.410219+00', 'password', 'dc6e7b14-8bf3-44d9-ba1e-7795285850f7'),
	('89b2109d-ad24-4185-bfc8-8b90c114402d', '2026-08-29 11:47:05.977499+00', '2026-08-29 11:47:05.977499+00', 'password', '68331785-142c-44ea-9fd9-788bbb0052e1'),
	('cd742a51-bb9a-4bf9-9bcc-97a7c0c3f8a4', '2026-08-29 11:49:23.087353+00', '2026-08-29 11:49:23.087353+00', 'password', 'c1a8a35d-6b37-4ccb-90f6-835847121681'),
	('6c856f7b-64a2-4b87-a7c5-7421c7aaee71', '2026-08-29 11:49:26.08714+00', '2026-08-29 11:49:26.08714+00', 'password', 'c2e21c4d-c622-4b80-b41c-ae677fd41db1'),
	('21655cf0-7cf9-4a5f-a951-2d42fdfad58a', '2026-08-29 11:55:15.699925+00', '2026-08-29 11:55:15.699925+00', 'password', 'f3f3a7e7-b363-4073-8873-af3f6d204c24'),
	('8e677f84-19b4-43bc-bd55-2094f030e851', '2026-08-29 11:55:19.292491+00', '2026-08-29 11:55:19.292491+00', 'password', '5bbc9fd6-0005-4546-a192-a9212932d344'),
	('1e46591e-f7f3-4729-af50-61e1f226edf7', '2026-08-29 12:02:43.427449+00', '2026-08-29 12:02:43.427449+00', 'password', 'b947e7ca-b837-4901-a1ec-a3fad2c13db1'),
	('532e8949-4bb2-4a21-a3cf-15933b578ba6', '2026-08-29 12:43:22.950442+00', '2026-08-29 12:43:22.950442+00', 'password', 'a2f5343c-3ed1-44fd-8651-7632eb9c940a'),
	('67c6b134-ddd5-4be8-b623-e1f4bce17cc2', '2026-08-29 12:43:27.224529+00', '2026-08-29 12:43:27.224529+00', 'password', '000ceec8-0d17-492d-aeb0-f959c80134c4'),
	('c2b9793b-e4c3-4cc6-b629-97de4d793416', '2026-08-29 12:43:27.360656+00', '2026-08-29 12:43:27.360656+00', 'password', 'e5683473-f2ba-4b05-bf79-b9c58da7dc30'),
	('9e967142-4440-4d97-adc6-295ff5ab164c', '2026-08-29 12:48:46.006057+00', '2026-08-29 12:48:46.006057+00', 'password', 'e8103325-9330-431b-9c83-2971ed287ee5'),
	('1e83e567-1b41-45dc-a614-d09e51d60f7a', '2026-08-29 12:48:46.014245+00', '2026-08-29 12:48:46.014245+00', 'password', '9476b0c6-a71f-4047-96b4-815f9d33010b'),
	('b5eb9e0c-339d-4743-aca2-888eeea2232b', '2026-08-29 12:48:46.439059+00', '2026-08-29 12:48:46.439059+00', 'password', 'e702d265-2520-4855-be0b-942e9c0cc543'),
	('5e9e0e6a-7872-415a-8936-fac1b967c64f', '2026-08-29 12:50:45.558187+00', '2026-08-29 12:50:45.558187+00', 'password', 'c3f3e0a0-d8da-4dc5-ad79-bdc88a97525c'),
	('0c66610d-b249-4628-9c00-f962420d181a', '2026-08-29 12:50:49.24362+00', '2026-08-29 12:50:49.24362+00', 'password', '58714b34-4fed-4f16-b39c-86dd6ce0f76a'),
	('ea270730-2a54-4f47-b17d-ef4de912ede6', '2026-08-29 12:50:50.92213+00', '2026-08-29 12:50:50.92213+00', 'password', '205885b8-97e5-444a-903c-d005dd199faa'),
	('c2f0dcf7-d21c-4ed7-ac5e-840884d84105', '2026-08-29 12:52:41.058822+00', '2026-08-29 12:52:41.058822+00', 'password', '6b0f70d8-97a5-4759-b9a7-e1c886772bab'),
	('07ac3e2e-44a0-4d84-b723-0dd88f053d74', '2026-08-29 12:52:42.192008+00', '2026-08-29 12:52:42.192008+00', 'password', '9ff7ee98-2c07-4d49-a2df-3b46a915633e'),
	('2c5d8e58-dc38-46be-8a20-39d80f7b63ad', '2026-08-29 12:52:42.245624+00', '2026-08-29 12:52:42.245624+00', 'password', '355394cc-326a-4ddb-b464-4487a0b10076'),
	('1aabddcc-a098-44e6-aef6-deee8bcaade6', '2026-08-29 12:56:02.336557+00', '2026-08-29 12:56:02.336557+00', 'password', '01252630-9d07-46b6-b8fd-6895a49da82c'),
	('29328107-44a7-48d9-a943-c306188699b5', '2026-08-29 12:56:03.188026+00', '2026-08-29 12:56:03.188026+00', 'password', '6d4f31fa-60c5-4688-86ae-4d3edae80706'),
	('4a5bdf42-a498-47dd-9980-f2707dcfb08c', '2026-08-29 12:56:03.645702+00', '2026-08-29 12:56:03.645702+00', 'password', '98e33054-062a-4bfc-ab44-ed355c54441b'),
	('b7ecd9e0-b30c-4191-9b36-7f24f45b90fc', '2026-08-29 12:58:06.488611+00', '2026-08-29 12:58:06.488611+00', 'password', '2e53e98d-91cc-4a92-87cd-0d90c994292c'),
	('9e455616-b2ed-48b3-968f-94f88c3bfddf', '2026-08-29 12:58:06.639928+00', '2026-08-29 12:58:06.639928+00', 'password', 'ee57e9c8-7937-4f4e-984f-e38d994169e5'),
	('91a699fd-2ef1-4ad5-afd8-7837d200612c', '2026-08-29 12:58:13.558711+00', '2026-08-29 12:58:13.558711+00', 'password', 'f52c364b-afdf-4243-b39b-ae5be9959600'),
	('8b382e63-f53f-4355-b22e-2cb724edea15', '2026-08-29 13:03:29.774185+00', '2026-08-29 13:03:29.774185+00', 'password', 'a7075545-7083-43d4-be5f-fb03400a038d'),
	('2f479571-bc49-4fed-bf9b-d11f6d2e8506', '2026-08-29 13:03:31.563335+00', '2026-08-29 13:03:31.563335+00', 'password', '84471ab6-4ec0-4d16-85b2-be45f5b229cc'),
	('ded92942-b8c0-4f1f-a27e-3253ccfd035c', '2026-08-29 13:03:33.024672+00', '2026-08-29 13:03:33.024672+00', 'password', '86cde9dd-5254-49e2-b858-662d61a4837f'),
	('49cb56e8-4746-40cd-961c-fb605dac67e8', '2026-09-01 07:21:01.103607+00', '2026-09-01 07:21:01.103607+00', 'password', 'd19c8a28-e28e-487f-922a-7238584f7e2f'),
	('34899a7f-6020-4f19-aca4-f5dbb99b12d6', '2026-09-01 07:21:01.290008+00', '2026-09-01 07:21:01.290008+00', 'password', '5589e817-73c1-4c16-8880-911c01416502'),
	('3f7e77ef-fd76-4204-b226-ad4ed220a02c', '2026-09-01 07:25:53.555981+00', '2026-09-01 07:25:53.555981+00', 'password', '9079bd6a-67ae-4548-8d3d-2f5b36eb1d7f'),
	('88fa9a88-8d60-407c-9361-7d2769f63049', '2026-09-01 07:25:53.724446+00', '2026-09-01 07:25:53.724446+00', 'password', 'ac98f9f6-fb6d-4194-b0aa-eeb9e1131cab');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'fl5dllgfmtir', '8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', false, '2026-08-29 11:08:22.35961+00', '2026-08-29 11:08:22.35961+00', NULL, 'fd4eb46f-38ce-4b9e-b2c7-82c4b6d2abb1'),
	('00000000-0000-0000-0000-000000000000', 2, 'noca6abcpk5q', '63058e8f-b5b9-426e-a2ed-8e20a44f3b8e', false, '2026-08-29 11:08:22.717589+00', '2026-08-29 11:08:22.717589+00', NULL, '748eb0e4-8194-46ff-8c32-18eecd43874e'),
	('00000000-0000-0000-0000-000000000000', 3, 'coae32ag2k3h', '83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', false, '2026-08-29 11:09:00.923748+00', '2026-08-29 11:09:00.923748+00', NULL, '71e4e4ba-e286-40b7-a8e1-b6b3e3d81945'),
	('00000000-0000-0000-0000-000000000000', 4, 'wxrwltckl2x7', '93218371-8eef-4196-93d4-c22368939498', false, '2026-08-29 11:09:01.051994+00', '2026-08-29 11:09:01.051994+00', NULL, '973a15b1-891c-4357-992c-fa0f496497fe'),
	('00000000-0000-0000-0000-000000000000', 5, 'un2uigkyz7hq', 'a3d201a9-d49e-4106-a881-228e639f0f0d', false, '2026-08-29 11:30:30.983651+00', '2026-08-29 11:30:30.983651+00', NULL, '05c34383-c23b-483f-9794-ae2d959bda41'),
	('00000000-0000-0000-0000-000000000000', 6, 'hoo7lkjsdk6c', '71ae826c-a97b-400c-91f6-b86b70e064cd', false, '2026-08-29 11:30:30.774622+00', '2026-08-29 11:30:30.774622+00', NULL, 'db9ac704-beeb-4df3-8e9f-975b03183f8c'),
	('00000000-0000-0000-0000-000000000000', 7, '33ftt2mz5new', 'bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e', false, '2026-08-29 11:34:16.348117+00', '2026-08-29 11:34:16.348117+00', NULL, 'c7636702-6108-4345-978c-e1d30fd8ffdd'),
	('00000000-0000-0000-0000-000000000000', 8, 'vemhfjj76ee7', 'f4043e11-b497-48b8-98a3-5bc51315171f', false, '2026-08-29 11:34:17.385141+00', '2026-08-29 11:34:17.385141+00', NULL, 'd0c2c4e7-0795-44ab-9c79-2f06fae6f954'),
	('00000000-0000-0000-0000-000000000000', 9, 'cymp7q7o26vt', 'e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8', false, '2026-08-29 11:35:55.380201+00', '2026-08-29 11:35:55.380201+00', NULL, '701d159a-2f41-4c67-94c1-59ecf81d2edd'),
	('00000000-0000-0000-0000-000000000000', 10, 'nchc4vmcjawe', '26fba916-be07-4aa6-866a-edcf948655bc', false, '2026-08-29 11:38:28.59655+00', '2026-08-29 11:38:28.59655+00', NULL, '153f7284-a8db-4467-85f7-38de5df95ad5'),
	('00000000-0000-0000-0000-000000000000', 11, 'jkvxsesygld7', 'c121fa79-47f2-4556-8ef5-feea4d788087', false, '2026-08-29 11:38:28.596628+00', '2026-08-29 11:38:28.596628+00', NULL, '8f1d2183-d21f-4c07-bbeb-1fce5f95a37d'),
	('00000000-0000-0000-0000-000000000000', 12, '3vxr334lmzgi', '26fba916-be07-4aa6-866a-edcf948655bc', false, '2026-08-29 11:38:46.774076+00', '2026-08-29 11:38:46.774076+00', NULL, '944a2717-81f1-4b4e-879a-1bde3f07e925'),
	('00000000-0000-0000-0000-000000000000', 13, 'au5lxldwkypi', 'c23b0c3c-84bf-489e-b885-0d555e54a4cf', false, '2026-08-29 11:43:25.683491+00', '2026-08-29 11:43:25.683491+00', NULL, 'b8a97b69-62a5-4431-b24f-4abbea9c5554'),
	('00000000-0000-0000-0000-000000000000', 14, 'fr7w6h6unzmi', '130a8ccf-30ba-441d-9fdd-c8833a398f09', false, '2026-08-29 11:43:25.875029+00', '2026-08-29 11:43:25.875029+00', NULL, '941a8bea-69b4-4bab-b3f7-5751fa8a805e'),
	('00000000-0000-0000-0000-000000000000', 15, 'eprpqv5fxrcy', 'c23b0c3c-84bf-489e-b885-0d555e54a4cf', false, '2026-08-29 11:43:27.822391+00', '2026-08-29 11:43:27.822391+00', NULL, '8a81790d-caac-4e70-be58-af0fef40f98f'),
	('00000000-0000-0000-0000-000000000000', 16, 'mwaxlkqkpmz6', 'f746e1c1-8a36-4ff5-9c93-68b36a1494c7', false, '2026-08-29 11:46:53.881622+00', '2026-08-29 11:46:53.881622+00', NULL, '3ab70370-d6f3-45ac-95c4-da2312ce0b73'),
	('00000000-0000-0000-0000-000000000000', 17, 'ar3svt4tki2v', '2d1808c5-695b-4b35-80aa-3002a26daa25', false, '2026-08-29 11:47:02.398594+00', '2026-08-29 11:47:02.398594+00', NULL, 'ae9f4277-c46e-4ab2-b03a-77ff0bcf834b'),
	('00000000-0000-0000-0000-000000000000', 18, 'piv6d77affkb', 'f746e1c1-8a36-4ff5-9c93-68b36a1494c7', false, '2026-08-29 11:47:05.899003+00', '2026-08-29 11:47:05.899003+00', NULL, '89b2109d-ad24-4185-bfc8-8b90c114402d'),
	('00000000-0000-0000-0000-000000000000', 19, 't6xvnzttxgo2', '0422e297-2c09-4520-a57c-cf70ad493fcf', false, '2026-08-29 11:49:23.00561+00', '2026-08-29 11:49:23.00561+00', NULL, 'cd742a51-bb9a-4bf9-9bcc-97a7c0c3f8a4'),
	('00000000-0000-0000-0000-000000000000', 20, 'fq5lz7t2zljj', '0422e297-2c09-4520-a57c-cf70ad493fcf', false, '2026-08-29 11:49:26.073599+00', '2026-08-29 11:49:26.073599+00', NULL, '6c856f7b-64a2-4b87-a7c5-7421c7aaee71'),
	('00000000-0000-0000-0000-000000000000', 21, 'kc2fiqrxmeyc', '76c983b0-c405-4f10-9682-8482f8863936', false, '2026-08-29 11:55:15.407838+00', '2026-08-29 11:55:15.407838+00', NULL, '21655cf0-7cf9-4a5f-a951-2d42fdfad58a'),
	('00000000-0000-0000-0000-000000000000', 22, 'jsz4oabqso6s', '200c4adc-688d-49e3-be53-6fa7a2dada9a', false, '2026-08-29 11:55:19.178177+00', '2026-08-29 11:55:19.178177+00', NULL, '8e677f84-19b4-43bc-bd55-2094f030e851'),
	('00000000-0000-0000-0000-000000000000', 23, 'tew57ozypodv', '0169c76d-ff68-48f5-9330-ac3fa8d02bb8', false, '2026-08-29 12:02:43.396676+00', '2026-08-29 12:02:43.396676+00', NULL, '1e46591e-f7f3-4729-af50-61e1f226edf7'),
	('00000000-0000-0000-0000-000000000000', 24, 'kknbxflbuzpe', '0109cb11-8c24-4581-92a0-fdbaab70187f', false, '2026-08-29 12:43:22.778573+00', '2026-08-29 12:43:22.778573+00', NULL, '532e8949-4bb2-4a21-a3cf-15933b578ba6'),
	('00000000-0000-0000-0000-000000000000', 25, 'tuoftuza424o', '0109cb11-8c24-4581-92a0-fdbaab70187f', false, '2026-08-29 12:43:27.186765+00', '2026-08-29 12:43:27.186765+00', NULL, '67c6b134-ddd5-4be8-b623-e1f4bce17cc2'),
	('00000000-0000-0000-0000-000000000000', 26, 'sm7eni5r7dkd', 'f3edeb9f-9878-4723-8fa7-36a4d34d345a', false, '2026-08-29 12:43:27.354243+00', '2026-08-29 12:43:27.354243+00', NULL, 'c2b9793b-e4c3-4cc6-b629-97de4d793416'),
	('00000000-0000-0000-0000-000000000000', 27, 'lrvbaypufqsq', '013447b6-0b04-4218-b6b6-964cc16b3e6c', false, '2026-08-29 12:48:45.978569+00', '2026-08-29 12:48:45.978569+00', NULL, '1e83e567-1b41-45dc-a614-d09e51d60f7a'),
	('00000000-0000-0000-0000-000000000000', 28, '2zazebfjq4cl', '7bb18ae6-9a37-48ac-9831-7484677ecdc1', false, '2026-08-29 12:48:45.978593+00', '2026-08-29 12:48:45.978593+00', NULL, '9e967142-4440-4d97-adc6-295ff5ab164c'),
	('00000000-0000-0000-0000-000000000000', 29, 'mimw4qaecqt4', '013447b6-0b04-4218-b6b6-964cc16b3e6c', false, '2026-08-29 12:48:46.433578+00', '2026-08-29 12:48:46.433578+00', NULL, 'b5eb9e0c-339d-4743-aca2-888eeea2232b'),
	('00000000-0000-0000-0000-000000000000', 30, 'vwgxuhclnboa', '556dbc04-7a39-4382-9e1d-dd20a4add384', false, '2026-08-29 12:50:45.538135+00', '2026-08-29 12:50:45.538135+00', NULL, '5e9e0e6a-7872-415a-8936-fac1b967c64f'),
	('00000000-0000-0000-0000-000000000000', 31, 'jc363kd7262j', 'b258f487-cf2d-499d-a047-7d55715a0b4e', false, '2026-08-29 12:50:49.234488+00', '2026-08-29 12:50:49.234488+00', NULL, '0c66610d-b249-4628-9c00-f962420d181a'),
	('00000000-0000-0000-0000-000000000000', 32, 'yv75qicvdla5', 'b258f487-cf2d-499d-a047-7d55715a0b4e', false, '2026-08-29 12:50:50.918563+00', '2026-08-29 12:50:50.918563+00', NULL, 'ea270730-2a54-4f47-b17d-ef4de912ede6'),
	('00000000-0000-0000-0000-000000000000', 33, 'euzdps66wwgd', 'f79bc07d-b968-4846-8991-ac3824bd89b2', false, '2026-08-29 12:52:41.01046+00', '2026-08-29 12:52:41.01046+00', NULL, 'c2f0dcf7-d21c-4ed7-ac5e-840884d84105'),
	('00000000-0000-0000-0000-000000000000', 34, 'fegvvow3anep', 'f79bc07d-b968-4846-8991-ac3824bd89b2', false, '2026-08-29 12:52:42.180614+00', '2026-08-29 12:52:42.180614+00', NULL, '07ac3e2e-44a0-4d84-b723-0dd88f053d74'),
	('00000000-0000-0000-0000-000000000000', 35, 'gi2h4rszczj3', '56cc2643-0c3d-4561-ab19-52733523e9cd', false, '2026-08-29 12:52:42.238621+00', '2026-08-29 12:52:42.238621+00', NULL, '2c5d8e58-dc38-46be-8a20-39d80f7b63ad'),
	('00000000-0000-0000-0000-000000000000', 36, 'hi35jx76s6vu', '92b50b56-264a-4d12-9c60-f461c7fe5d62', false, '2026-08-29 12:56:02.107137+00', '2026-08-29 12:56:02.107137+00', NULL, '1aabddcc-a098-44e6-aef6-deee8bcaade6'),
	('00000000-0000-0000-0000-000000000000', 37, 'qfaev42l4eum', 'd48eb217-ebc8-4b28-a981-aee75cad7a66', false, '2026-08-29 12:56:03.183777+00', '2026-08-29 12:56:03.183777+00', NULL, '29328107-44a7-48d9-a943-c306188699b5'),
	('00000000-0000-0000-0000-000000000000', 38, 'p43ung5rynz4', 'd48eb217-ebc8-4b28-a981-aee75cad7a66', false, '2026-08-29 12:56:03.636158+00', '2026-08-29 12:56:03.636158+00', NULL, '4a5bdf42-a498-47dd-9980-f2707dcfb08c'),
	('00000000-0000-0000-0000-000000000000', 39, 'ebwyxvafu5od', '92346415-7367-4a11-96de-faf84f00f0f8', false, '2026-08-29 12:58:06.474562+00', '2026-08-29 12:58:06.474562+00', NULL, 'b7ecd9e0-b30c-4191-9b36-7f24f45b90fc'),
	('00000000-0000-0000-0000-000000000000', 40, 'e5nake65arp2', '58503c92-9399-4a82-955b-25724a3f4cbc', false, '2026-08-29 12:58:06.597911+00', '2026-08-29 12:58:06.597911+00', NULL, '9e455616-b2ed-48b3-968f-94f88c3bfddf'),
	('00000000-0000-0000-0000-000000000000', 41, 'nxsvtsregdp3', '58503c92-9399-4a82-955b-25724a3f4cbc', false, '2026-08-29 12:58:13.553757+00', '2026-08-29 12:58:13.553757+00', NULL, '91a699fd-2ef1-4ad5-afd8-7837d200612c'),
	('00000000-0000-0000-0000-000000000000', 69, 'p2gl2bdh7z3q', '1d478337-7633-4a29-892c-c152986f0d00', false, '2026-08-29 13:03:29.598686+00', '2026-08-29 13:03:29.598686+00', NULL, '8b382e63-f53f-4355-b22e-2cb724edea15'),
	('00000000-0000-0000-0000-000000000000', 70, '6c44rgjt5mgs', '64f314bd-1e50-468d-a4fd-bd9ea1a381ab', false, '2026-08-29 13:03:31.548529+00', '2026-08-29 13:03:31.548529+00', NULL, '2f479571-bc49-4fed-bf9b-d11f6d2e8506'),
	('00000000-0000-0000-0000-000000000000', 71, 'fusadw3uus2z', '1d478337-7633-4a29-892c-c152986f0d00', false, '2026-08-29 13:03:33.001257+00', '2026-08-29 13:03:33.001257+00', NULL, 'ded92942-b8c0-4f1f-a27e-3253ccfd035c'),
	('00000000-0000-0000-0000-000000000000', 72, 'xczgst3oph6f', 'c7f08ac4-273e-484b-a96a-49c136bcdbf5', false, '2026-09-01 07:21:01.082945+00', '2026-09-01 07:21:01.082945+00', NULL, '49cb56e8-4746-40cd-961c-fb605dac67e8'),
	('00000000-0000-0000-0000-000000000000', 73, '3tpj6dxsxbbd', 'c7f08ac4-273e-484b-a96a-49c136bcdbf5', false, '2026-09-01 07:21:01.287618+00', '2026-09-01 07:21:01.287618+00', NULL, '34899a7f-6020-4f19-aca4-f5dbb99b12d6'),
	('00000000-0000-0000-0000-000000000000', 74, 'm35emf4s5jcg', '235ebf98-780e-4158-abda-436d2d876510', false, '2026-09-01 07:25:53.547659+00', '2026-09-01 07:25:53.547659+00', NULL, '3f7e77ef-fd76-4204-b226-ad4ed220a02c'),
	('00000000-0000-0000-0000-000000000000', 75, 'rzc77eys5mh3', '235ebf98-780e-4158-abda-436d2d876510', false, '2026-09-01 07:25:53.722341+00', '2026-09-01 07:25:53.722341+00', NULL, '88fa9a88-8d60-407c-9361-7d2769f63049');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "name", "phone", "role", "avatar_url", "created_at", "updated_at") VALUES
	('8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', 'customer_a_1788001697562@example.com', 'Customer A', NULL, 'customer', NULL, '2026-08-29 11:08:21.848275+00', '2026-08-29 11:08:21.848275+00'),
	('63058e8f-b5b9-426e-a2ed-8e20a44f3b8e', 'customer_b_1788001697562@example.com', 'Customer B', NULL, 'customer', NULL, '2026-08-29 11:08:21.848275+00', '2026-08-29 11:08:21.848275+00'),
	('83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', 'customer_a_1788001739992@example.com', 'Customer A', NULL, 'customer', NULL, '2026-08-29 11:09:00.750006+00', '2026-08-29 11:09:00.750006+00'),
	('93218371-8eef-4196-93d4-c22368939498', 'customer_b_1788001739992@example.com', 'Customer B', NULL, 'customer', NULL, '2026-08-29 11:09:00.750006+00', '2026-08-29 11:09:00.750006+00'),
	('a14e16eb-4f84-4572-9828-8efeebf9fcdf', 'admin_1788002847865@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:27:31.692484+00', '2026-08-29 11:27:31.692484+00'),
	('71ae826c-a97b-400c-91f6-b86b70e064cd', 'admin_1788003006467@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:30:09.833108+00', '2026-08-29 11:30:09.833108+00'),
	('bfa5aed8-99f9-4ab3-a670-9e6e2d98fc0e', 'admin_1788003233850@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:33:55.826115+00', '2026-08-29 11:33:55.826115+00'),
	('e9218cc8-75f8-4a4b-9bf9-48f4dbc47fa8', 'admin_1788003344804@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:35:46.402685+00', '2026-08-29 11:35:46.402685+00'),
	('c121fa79-47f2-4556-8ef5-feea4d788087', 'admin_1788003489577@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:38:12.565926+00', '2026-08-29 11:38:12.565926+00'),
	('26fba916-be07-4aa6-866a-edcf948655bc', 'auth_test_1788003505270@example.com', 'Auth Test User', NULL, 'customer', NULL, '2026-08-29 11:38:42.367123+00', '2026-08-29 11:38:42.367123+00'),
	('130a8ccf-30ba-441d-9fdd-c8833a398f09', 'admin_1788003775181@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:43:04.468964+00', '2026-08-29 11:43:04.468964+00'),
	('c23b0c3c-84bf-489e-b885-0d555e54a4cf', 'auth_test_1788003799276@example.com', 'Auth Test User', NULL, 'customer', NULL, '2026-08-29 11:43:27.294949+00', '2026-08-29 11:43:27.294949+00'),
	('2d1808c5-695b-4b35-80aa-3002a26daa25', 'admin_1788004005001@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:46:53.481506+00', '2026-08-29 11:46:53.481506+00'),
	('f746e1c1-8a36-4ff5-9c93-68b36a1494c7', 'auth_test_1788004009351@example.com', 'Auth Test User', NULL, 'customer', NULL, '2026-08-29 11:47:05.083941+00', '2026-08-29 11:47:05.083941+00'),
	('0422e297-2c09-4520-a57c-cf70ad493fcf', 'auth_test_1788004159038@example.com', 'Auth Test User', NULL, 'customer', NULL, '2026-08-29 11:49:25.102564+00', '2026-08-29 11:49:25.102564+00'),
	('200c4adc-688d-49e3-be53-6fa7a2dada9a', 'admin_1788004504100@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 11:55:14.850294+00', '2026-08-29 11:55:14.850294+00'),
	('76c983b0-c405-4f10-9682-8482f8863936', 'auth_test_1788004508901@example.com', 'Auth Test User', NULL, 'customer', NULL, '2026-08-29 11:55:23.434543+00', '2026-08-29 11:55:23.434543+00'),
	('0169c76d-ff68-48f5-9330-ac3fa8d02bb8', 'admin_1788004947259@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:02:32.725635+00', '2026-08-29 12:02:32.725635+00'),
	('f3edeb9f-9878-4723-8fa7-36a4d34d345a', 'admin_1788007397171@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:43:22.469911+00', '2026-08-29 12:43:22.469911+00'),
	('7bb18ae6-9a37-48ac-9831-7484677ecdc1', 'admin_1788007716727@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:48:39.898053+00', '2026-08-29 12:48:39.898053+00'),
	('556dbc04-7a39-4382-9e1d-dd20a4add384', 'admin_1788007838435@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:50:40.265279+00', '2026-08-29 12:50:40.265279+00'),
	('56cc2643-0c3d-4561-ab19-52733523e9cd', 'admin_1788007953109@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:52:36.40091+00', '2026-08-29 12:52:36.40091+00'),
	('92b50b56-264a-4d12-9c60-f461c7fe5d62', 'admin_1788008156036@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:55:57.87309+00', '2026-08-29 12:55:57.87309+00'),
	('92346415-7367-4a11-96de-faf84f00f0f8', 'admin_1788008276045@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 12:57:58.440475+00', '2026-08-29 12:57:58.440475+00'),
	('64f314bd-1e50-468d-a4fd-bd9ea1a381ab', 'admin_1788008601483@example.com', 'E2E Admin', NULL, 'admin', NULL, '2026-08-29 13:03:23.848397+00', '2026-08-29 13:03:23.848397+00'),
	('235ebf98-780e-4158-abda-436d2d876510', 'favazmk12@gmail.com', 'Favaz', NULL, 'admin', NULL, '2026-09-01 07:33:41.514166+00', '2026-09-01 07:33:41.514166+00');


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."carts" ("id", "user_id", "guest_token", "created_at", "updated_at", "expires_at") VALUES
	('bc19fe39-c4c2-4ef2-b2bc-39a0a2111b74', NULL, 'test-guest-token', '2026-08-29 08:35:20.326363+00', '2026-08-29 08:35:20.326363+00', '2026-09-28 08:35:20.326363+00'),
	('1d1b528f-20fc-43c9-a5a5-7e73df26928c', NULL, 'test-guest-token-1787992714783', '2026-08-29 08:38:34.85074+00', '2026-08-29 08:38:35.025+00', '2026-09-28 08:38:34.85074+00'),
	('7394e340-9e15-4c75-84f8-b2bedad303ef', NULL, 'test-guest-token-1787992738758', '2026-08-29 08:38:58.783754+00', '2026-08-29 08:38:58.892+00', '2026-09-28 08:38:58.783754+00'),
	('cab3e28a-5e59-4013-aa33-f79cda9cc93d', NULL, 'test-guest-token-1787994440383', '2026-08-29 09:07:21.541241+00', '2026-08-29 09:07:20.567+00', '2026-09-28 09:07:21.541241+00'),
	('e46e402b-bff4-49dc-b68d-7b1b9d5c6fcb', NULL, 'test-guest-token-1787994454723', '2026-08-29 09:07:34.062703+00', '2026-08-29 09:07:36.023+00', '2026-09-28 09:07:34.062703+00'),
	('fa6744c8-ee41-4722-aaf3-48783b3d524e', NULL, 'test-guest-token-1787997418153', '2026-08-29 09:56:58.169088+00', '2026-08-29 09:56:58.258+00', '2026-09-28 09:56:58.169088+00'),
	('d8259f41-fdd3-4ce3-a4f6-5e53c1ea6fb6', NULL, 'test-guest-token-1787997467614', '2026-08-29 09:57:47.630786+00', '2026-08-29 09:57:47.742+00', '2026-09-28 09:57:47.630786+00'),
	('a3dc3570-7d47-4989-bfeb-16654c9c2087', NULL, 'test-guest-token-1788001556106', '2026-08-29 11:05:56.122352+00', '2026-08-29 11:05:56.238+00', '2026-09-28 11:05:56.122352+00'),
	('37681b24-6a04-4002-85d6-5aeb7c438727', NULL, 'test-guest-token-1788001699144', '2026-08-29 11:08:19.161823+00', '2026-08-29 11:08:19.353+00', '2026-09-28 11:08:19.161823+00'),
	('49173a6b-e1f8-47a0-8975-b8c7cd30781f', NULL, 'test-guest-token-1788001740469', '2026-08-29 11:09:00.478009+00', '2026-08-29 11:09:00.561+00', '2026-09-28 11:09:00.478009+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "name", "slug", "description", "image_url", "parent_id", "display_order", "is_active", "metadata", "created_at", "updated_at") VALUES
	('c1000000-0000-0000-0000-000000000001', 'Luxury Apparel', 'luxury-apparel', 'Curated collection of premium bespoke garments, jackets, and knitwear.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80', NULL, 1, true, '{}', '2026-08-29 08:21:31.109421+00', '2026-08-29 08:21:31.109421+00'),
	('c1000000-0000-0000-0000-000000000002', 'Artisanal Footwear', 'artisanal-footwear', 'Handcrafted leather shoes, minimalist sneakers, and heritage boots.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80', NULL, 2, true, '{}', '2026-08-29 08:21:31.109421+00', '2026-08-29 08:21:31.109421+00'),
	('c1000000-0000-0000-0000-000000000003', 'Designer Accessories', 'designer-accessories', 'Italian leather goods, chronographs, eyewear, and fine jewelry.', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop&q=80', NULL, 3, true, '{}', '2026-08-29 08:21:31.109421+00', '2026-08-29 08:21:31.109421+00'),
	('c1000000-0000-0000-0000-000000000004', 'Home & Living', 'home-and-living', 'Minimalist ceramic homeware, organic linen, and sculptural accents.', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80', NULL, 4, true, '{}', '2026-08-29 08:21:31.109421+00', '2026-08-29 08:21:31.109421+00');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "name", "slug", "description", "short_description", "sku", "price", "compare_at_price", "cost_price", "currency", "stock_quantity", "low_stock_threshold", "status", "featured", "category_id", "brand", "tags", "seo_title", "seo_description", "metadata", "created_at", "updated_at") VALUES
	('83622b90-e80e-460f-b331-9156b7c42141', 'Concurrency Test Product', 'concurrency-test-1787991800252', 'A test product', 'A short test', 'SKU-CONC-1787991800252', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:23:21.253477+00', '2026-08-29 08:23:21.253477+00'),
	('5e6fbe07-ca18-4948-b739-1d0efaf0f761', 'Integration Test Product', 'integration-test-1787992519656', 'A test product', 'A short test', 'SKU-1787992519656', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:35:20.077378+00', '2026-08-29 08:35:20.077378+00'),
	('594df72e-557f-4118-9502-481832be4466', 'Concurrency Test Product', 'concurrency-test-1787992519679', 'A test product', 'A short test', 'SKU-CONC-1787992519679', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:35:20.077378+00', '2026-08-29 08:35:20.077378+00'),
	('ff8236b0-966d-43ce-8ec3-22ba1dc72ea4', 'Integration Test Product', 'integration-test-1788001740237', 'A test product', 'A short test', 'SKU-1788001740237', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:09:00.328362+00', '2026-08-29 11:09:00.328362+00'),
	('a5d6475e-a667-4c6a-a2f0-3ee790b6f610', 'Tamper Test Product', 'e2e-tamper-1788007839183', '', '', 'e2e-tamper-1788007839183', 100.00, NULL, NULL, 'USD', 9, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:50:39.470785+00', '2026-08-29 12:50:49.081354+00'),
	('fad17d98-4e86-42b3-9c9e-f6c62e9be357', 'Tamper Test Product', 'e2e-tamper-1788008602363', '', '', 'e2e-tamper-1788008602363', 100.00, NULL, NULL, 'USD', 9, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 13:03:22.937664+00', '2026-08-29 13:03:33.455385+00'),
	('2f855dfa-7de4-49ce-918d-0788f6d88397', 'Concurrency Test Product', 'concurrency-test-1787992572761', 'A test product', 'A short test', 'SKU-CONC-1787992572761', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:36:17.185341+00', '2026-08-29 08:36:17.185341+00'),
	('a08dfca2-d530-402d-9e4e-f50be7bb419b', 'Tamper Test Product', 'e2e-tamper-1788002851548', '', '', 'e2e-tamper-1788002851548', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:27:31.653394+00', '2026-08-29 11:27:31.653394+00'),
	('220b82f1-e640-4a3e-b8f0-48fe7d8d155a', 'E2E Test Product', 'e2e-cust-prod-1788007842384', '', '', 'e2e-cust-prod-1788007842384', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:50:42.475583+00', '2026-08-29 12:50:55.680848+00'),
	('208cfb72-dcec-40b9-82d3-a13e4cb89d2e', 'E2E Test Product', 'e2e-cust-prod-1788008605126', '', '', 'e2e-cust-prod-1788008605126', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 13:03:25.569485+00', '2026-08-29 13:03:43.714777+00'),
	('7f7a0de3-2be2-4d4c-9341-4b07849cd20f', 'Integration Test Product', 'integration-test-1787992572556', 'A test product', 'A short test', 'SKU-1787992572556', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:36:17.184857+00', '2026-08-29 08:36:17.184857+00'),
	('de39a314-a54f-41d6-aeb4-90507fa1ab25', 'E2E Test Product', 'e2e-cust-prod-1788002886090', '', '', 'e2e-cust-prod-1788002886090', 250.00, NULL, NULL, 'USD', 50, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:28:06.150345+00', '2026-08-29 11:28:06.150345+00'),
	('1bf2db6c-b2aa-4045-88a0-9ba1f78cd456', 'Tamper Test Product', 'e2e-tamper-1788007954393', '', '', 'e2e-tamper-1788007954393', 100.00, NULL, NULL, 'USD', 9, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:52:34.699725+00', '2026-08-29 12:52:43.319182+00'),
	('15107564-3b1f-4081-8684-80255977b73d', 'New Admin Product 1788008617440', 'new-admin-product-1788008617593', 'Test description for admin product', 'Test short description for admin product', 'SKU-1788008617760', 199.99, NULL, NULL, 'USD', 100, 5, 'active', false, 'c1000000-0000-0000-0000-000000000001', 'Aura Studio', '{}', 'New Admin Product 1788008617440', 'Test short description for admin product', '{}', '2026-08-29 13:03:38.727976+00', '2026-08-29 13:03:38.727976+00'),
	('5fa95244-d247-45ed-b4a5-355eebadb0d6', 'Integration Test Product', 'integration-test-1787992653924', 'A test product', 'A short test', 'SKU-1787992653924', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:37:36.302725+00', '2026-08-29 08:37:36.302725+00'),
	('92654dca-c933-4513-a3bf-c440193d7d3e', 'Concurrency Test Product', 'concurrency-test-1787992653976', 'A test product', 'A short test', 'SKU-CONC-1787992653976', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:37:36.302701+00', '2026-08-29 08:37:37.813772+00'),
	('16e4df7a-7c2b-4715-bc56-2986846fc71f', 'Tamper Test Product', 'e2e-tamper-1788003008192', '', '', 'e2e-tamper-1788003008192', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:30:08.628716+00', '2026-08-29 11:30:08.628716+00'),
	('21a11527-26ce-4afa-bc23-d1373bd2fa10', 'E2E Test Product', 'e2e-cust-prod-1788007960887', '', '', 'e2e-cust-prod-1788007960887', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:52:41.113366+00', '2026-08-29 12:52:53.238192+00'),
	('77781a56-a06a-4b55-978e-41e07b1b300d', 'Integration Test Product', 'integration-test-1787992713758', 'A test product', 'A short test', 'SKU-1787992713758', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:38:34.461355+00', '2026-08-29 08:38:34.461355+00'),
	('aee2c808-6706-46e6-9131-e9c76e0b4720', 'Concurrency Test Product', 'concurrency-test-1787992713814', 'A test product', 'A short test', 'SKU-CONC-1787992713815', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:38:34.461355+00', '2026-08-29 08:38:34.926795+00'),
	('ec228a56-9049-4811-a325-f5c42851d34e', 'Integration Test Product', 'integration-test-1787992737996', 'A test product', 'A short test', 'SKU-1787992737996', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:38:58.545354+00', '2026-08-29 08:38:58.545354+00'),
	('7398039f-812a-4265-b621-c10fb215cce9', 'Concurrency Test Product', 'concurrency-test-1787992738094', 'A test product', 'A short test', 'SKU-CONC-1787992738094', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:38:58.609022+00', '2026-08-29 08:38:58.796517+00'),
	('cba7c03f-69c9-4b19-941a-9e6f5a3a9450', 'E2E Test Product', 'e2e-cust-prod-1788003041038', '', '', 'e2e-cust-prod-1788003041038', 250.00, NULL, NULL, 'USD', 50, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:30:43.054085+00', '2026-08-29 11:30:43.054085+00'),
	('795f2a67-2d5a-4fa8-81ca-bd59e61731e2', 'Tamper Test Product', 'e2e-tamper-1788008157183', '', '', 'e2e-tamper-1788008157183', 100.00, NULL, NULL, 'USD', 9, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:55:57.375082+00', '2026-08-29 12:56:10.876877+00'),
	('5b9a72ff-39b5-490a-9ff4-e6686c5e960f', 'Integration Test Product', 'integration-test-1787994242184', 'A test product', 'A short test', 'SKU-1787994242184', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:04:05.655534+00', '2026-08-29 09:04:05.655534+00'),
	('f74f909f-0144-4115-aef3-035fdb2f0e20', 'Concurrency Test Product', 'concurrency-test-1787994242060', 'A test product', 'A short test', 'SKU-CONC-1787994242060', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:04:05.655534+00', '2026-08-29 09:04:05.655534+00'),
	('bce49e3b-d1fb-4fa2-8179-de1932c77f12', 'Concurrency Test Product', 'concurrency-test-1787994242362', 'A test product', 'A short test', 'SKU-CONC-1787994242362', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:04:05.709799+00', '2026-08-29 09:04:05.709799+00'),
	('c5775901-7846-481c-bf10-9638e91a65a4', 'Integration Test Product', 'integration-test-1787994241953', 'A test product', 'A short test', 'SKU-1787994241953', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:04:05.655511+00', '2026-08-29 09:04:05.655511+00'),
	('24c7b860-5cb7-4b5a-b5a4-5016a50ae647', 'Tamper Test Product', 'e2e-tamper-1788003234927', '', '', 'e2e-tamper-1788003234927', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:33:55.170753+00', '2026-08-29 11:33:55.170753+00'),
	('e5bdfa3c-2708-4ca1-b009-22ba003ca3b1', 'E2E Test Product', 'e2e-cust-prod-1788008164011', '', '', 'e2e-cust-prod-1788008164011', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:56:06.562505+00', '2026-08-29 12:56:15.630885+00'),
	('7505f0a8-ae5f-489c-b767-ba254ec8a125', 'Concurrency Test Product', 'concurrency-test-1787994290201', 'A test product', 'A short test', 'SKU-CONC-1787994290201', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:04:53.728755+00', '2026-08-29 09:04:53.728755+00'),
	('3ac64878-96a7-48c0-9837-62e6a87e396b', 'Integration Test Product', 'integration-test-1787994290154', 'A test product', 'A short test', 'SKU-1787994290154', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:04:53.73049+00', '2026-08-29 09:04:53.73049+00'),
	('6f1c97bb-c433-4bcd-8631-72a8c1798782', 'Tamper Test Product', 'e2e-tamper-1788003491617', '', '', 'e2e-tamper-1788003491617', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:38:12.086803+00', '2026-08-29 11:38:12.086803+00'),
	('9055495a-6ec6-4ab5-abac-58215d481393', 'Tamper Test Product', 'e2e-tamper-1788008277584', '', '', 'e2e-tamper-1788008277584', 100.00, NULL, NULL, 'USD', 9, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:57:58.351341+00', '2026-08-29 12:58:05.79234+00'),
	('2bf97590-07a2-4f68-8567-c6f15d7aa761', 'Concurrency Test Product', 'concurrency-test-1787994342736', 'A test product', 'A short test', 'SKU-CONC-1787994342736', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:05:43.275481+00', '2026-08-29 09:05:43.275481+00'),
	('483f3bb7-9b99-4442-91b7-6508f0cc8d5c', 'E2E Test Product', 'e2e-cust-prod-1788003507437', '', '', 'e2e-cust-prod-1788003507437', 250.00, NULL, NULL, 'USD', 50, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:38:28.09086+00', '2026-08-29 11:38:28.09086+00'),
	('1f395d0a-0c93-4b93-87df-e75a0bf4340c', 'E2E Test Product', 'e2e-cust-prod-1788008282318', '', '', 'e2e-cust-prod-1788008282318', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:58:02.486926+00', '2026-08-29 12:58:18.766738+00'),
	('efda87dc-840d-4eff-b59d-269a08734528', 'Integration Test Product', 'integration-test-1787994342686', 'A test product', 'A short test', 'SKU-1787994342686', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:05:43.275493+00', '2026-08-29 09:05:43.275493+00'),
	('5a4c5612-3b4c-4ec9-94b6-7f226572e513', 'Tamper Test Product', 'e2e-tamper-1788003783165', '', '', 'e2e-tamper-1788003783165', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:43:03.72844+00', '2026-08-29 11:43:03.72844+00'),
	('86be98dd-7726-4471-9db2-6e89710ce017', 'Concurrency Test Product', 'concurrency-test-1787994396229', 'A test product', 'A short test', 'SKU-CONC-1787994396229', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:06:35.023528+00', '2026-08-29 09:06:35.023528+00'),
	('05d56cfb-7086-483b-a2c4-a48d0a645d83', 'Integration Test Product', 'integration-test-1787994396195', 'A test product', 'A short test', 'SKU-1787994396195', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:06:35.023413+00', '2026-08-29 09:06:35.023413+00'),
	('f2834ed8-b9d4-49fc-8a84-4ff7b567b16b', 'E2E Test Product', 'e2e-cust-prod-1788003807773', '', '', 'e2e-cust-prod-1788003807773', 250.00, NULL, NULL, 'USD', 50, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:43:28.032097+00', '2026-08-29 11:43:28.032097+00'),
	('39c7dac9-169d-4dd1-889f-bd36fbff25e6', 'Integration Test Product', 'integration-test-1787994439605', 'A test product', 'A short test', 'SKU-1787994439605', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:07:21.206011+00', '2026-08-29 09:07:21.206011+00'),
	('c65b623f-bacf-4389-9b0f-f28f57f6286a', 'Concurrency Test Product', 'concurrency-test-1787994439637', 'A test product', 'A short test', 'SKU-CONC-1787994439637', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:07:21.206113+00', '2026-08-29 09:07:21.603438+00'),
	('4277a6f0-89cb-4876-a8a5-5cbc90bd763e', 'Integration Test Product', 'integration-test-1787994452646', 'A test product', 'A short test', 'SKU-1787994452646', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:07:33.087141+00', '2026-08-29 09:07:33.087141+00'),
	('4eabcb1c-4d27-49dd-aaba-d86b26a81207', 'Concurrency Test Product', 'concurrency-test-1787994452650', 'A test product', 'A short test', 'SKU-CONC-1787994452650', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:07:33.186563+00', '2026-08-29 09:07:34.171698+00'),
	('49770443-39a4-42d3-bf2d-9f7780745a0f', 'Tamper Test Product', 'e2e-tamper-1788004007179', '', '', 'e2e-tamper-1788004007179', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:46:47.813241+00', '2026-08-29 11:46:47.813241+00'),
	('4ac34cfa-ba19-466a-9934-18f6f158014c', 'Integration Test Product', 'integration-test-1787997416700', 'A test product', 'A short test', 'SKU-1787997416700', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:56:57.976688+00', '2026-08-29 09:56:57.976688+00'),
	('818c6bf2-a3f7-4d5d-875b-e4e412112551', 'Concurrency Test Product', 'concurrency-test-1787997416740', 'A test product', 'A short test', 'SKU-CONC-1787997416740', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:56:57.976863+00', '2026-08-29 09:56:58.229511+00'),
	('c722cfc3-df77-4bf2-934b-a274516f3be8', 'E2E Test Product', 'e2e-cust-prod-1788004011181', '', '', 'e2e-cust-prod-1788004011181', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:46:51.344934+00', '2026-08-29 11:47:04.59315+00'),
	('b9344257-5d4a-468d-b8a2-72e67aa4509e', 'Concurrency Test Product', 'concurrency-test-1787997467192', 'A test product', 'A short test', 'SKU-CONC-1787997467192', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:57:47.351048+00', '2026-08-29 09:57:47.641143+00'),
	('53810270-bc99-4eaf-8ad0-75a4d1ff4e59', 'Tamper Test Product', 'e2e-tamper-1788004156433', '', '', 'e2e-tamper-1788004156433', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:49:17.345113+00', '2026-08-29 11:49:17.345113+00'),
	('8bf83a5d-08d1-4b1f-ac62-f0bf1937c06a', 'Integration Test Product', 'integration-test-1787997467159', 'A test product', 'A short test', 'SKU-1787997467159', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 09:57:47.365614+00', '2026-08-29 09:57:47.365614+00'),
	('49134404-dd32-4c23-8628-93fe67b44a40', 'Tamper Test Product', 'e2e-tamper-1788004506502', '', '', 'e2e-tamper-1788004506502', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:55:08.158956+00', '2026-08-29 11:55:08.158956+00'),
	('5288484f-9f49-417b-9efc-5f2e02459ec2', 'Tamper Test Product', 'e2e-tamper-1788004948656', '', '', 'e2e-tamper-1788004948656', 100.00, NULL, NULL, 'USD', 10, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:02:29.15112+00', '2026-08-29 12:02:29.15112+00'),
	('21171b6e-24b2-4a29-8f78-7ddffc03542e', 'Integration Test Product', 'integration-test-1788001554464', 'A test product', 'A short test', 'SKU-1788001554464', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:05:55.92289+00', '2026-08-29 11:05:55.92289+00'),
	('e9f9afd1-6b70-482f-98c0-495b796ad9d4', 'Concurrency Test Product', 'concurrency-test-1788001554496', 'A test product', 'A short test', 'SKU-CONC-1788001554496', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:05:55.922563+00', '2026-08-29 11:05:56.144272+00'),
	('95efcb9b-3b42-4810-9855-ffc4094c9203', 'E2E Test Product', 'e2e-cust-prod-1788004509281', '', '', 'e2e-cust-prod-1788004509281', 250.00, NULL, NULL, 'USD', 50, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:55:09.383852+00', '2026-08-29 11:55:09.383852+00'),
	('62d5d72b-a448-4481-8aeb-9bacb47f728d', 'Constraint Test Product', 'const-test-1788001697555', '', '', 'SKU-CONST-1788001697554', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:08:18.299949+00', '2026-08-29 11:08:18.299949+00'),
	('c97fcc2e-0e6b-40f7-8df2-67e847405537', 'Concurrency Test Product', 'concurrency-test-1788001698045', 'A test product', 'A short test', 'SKU-CONC-1788001698046', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:08:18.344932+00', '2026-08-29 11:08:19.248673+00'),
	('a1b17281-1fd0-480e-b940-666b5f5fb036', 'E2E Test Product', 'e2e-cust-prod-1788004967382', '', '', 'e2e-cust-prod-1788004967382', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:02:47.827059+00', '2026-08-29 12:03:02.473901+00'),
	('2708d075-3f21-41c8-b17e-c3258016b211', 'Integration Test Product', 'integration-test-1788001698010', 'A test product', 'A short test', 'SKU-1788001698010', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:08:18.318014+00', '2026-08-29 11:08:18.318014+00'),
	('94cf2cf6-9e3c-4908-8ecf-f865d4debd9c', 'Tamper Test Product', 'e2e-tamper-1788007398047', '', '', 'e2e-tamper-1788007398047', 100.00, NULL, NULL, 'USD', 10, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:43:18.320814+00', '2026-08-29 12:43:18.320814+00'),
	('9a5021d9-b35a-4c8b-b04c-0f4476fd55cf', 'Constraint Test Product', 'const-test-1788001739957', '', '', 'SKU-CONST-1788001739957', 100.00, NULL, NULL, 'USD', 10, 5, 'draft', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:09:00.168354+00', '2026-08-29 11:09:00.168354+00'),
	('9565a18b-4276-4746-a1fd-03c0489a0eb7', 'E2E Test Product', 'e2e-cust-prod-1788007401360', '', '', 'e2e-cust-prod-1788007401360', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:43:21.468185+00', '2026-08-29 12:43:38.39015+00'),
	('c8e074dc-108f-4481-9867-37f151a8feb6', 'Tamper Test Product', 'e2e-tamper-1788007718988', '', '', 'e2e-tamper-1788007718988', 100.00, NULL, NULL, 'USD', 9, 5, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:48:39.846234+00', '2026-08-29 12:49:00.442737+00'),
	('22570b79-40d7-402b-859b-9fb552cd1b01', 'Concurrency Test Product', 'concurrency-test-1788001740263', 'A test product', 'A short test', 'SKU-CONC-1788001740263', 199.99, NULL, NULL, 'USD', 1, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 11:09:00.308073+00', '2026-08-29 11:09:00.440213+00'),
	('7daa813f-a11c-421d-a55f-d14c926bd6b5', 'E2E Test Product', 'e2e-cust-prod-1788007724680', '', '', 'e2e-cust-prod-1788007724680', 250.00, NULL, NULL, 'USD', 49, 5, 'active', true, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 12:48:45.774887+00', '2026-08-29 12:48:57.685002+00'),
	('76bf7d2d-37a5-4659-bf08-0a356ce817c7', 'Integration Test Product', 'integration-test-1787991799985', 'A test product', 'A short test', 'SKU-1787991799985', 199.99, NULL, NULL, 'USD', 10, 2, 'active', false, NULL, NULL, '{}', NULL, NULL, '{}', '2026-08-29 08:23:21.253301+00', '2026-08-29 08:23:21.253301+00');


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cart_items" ("id", "cart_id", "product_id", "variant_id", "quantity", "created_at", "updated_at") VALUES
	('fd5047cc-e1f7-4362-938f-226f9cf6f33f', '1d1b528f-20fc-43c9-a5a5-7e73df26928c', '77781a56-a06a-4b55-978e-41e07b1b300d', NULL, 1, '2026-08-29 08:38:34.995732+00', '2026-08-29 08:38:34.995732+00'),
	('a2ea1b18-3175-4806-ae80-c778c7567a64', '7394e340-9e15-4c75-84f8-b2bedad303ef', 'ec228a56-9049-4811-a325-f5c42851d34e', NULL, 1, '2026-08-29 08:38:58.877767+00', '2026-08-29 08:38:58.877767+00'),
	('e002e4b5-6d7b-4c39-bd33-dc3b71d82086', 'cab3e28a-5e59-4013-aa33-f79cda9cc93d', '39c7dac9-169d-4dd1-889f-bd36fbff25e6', NULL, 1, '2026-08-29 09:07:21.663344+00', '2026-08-29 09:07:21.663344+00'),
	('15b2d731-a606-4f43-b2e1-694f433e47fd', 'e46e402b-bff4-49dc-b68d-7b1b9d5c6fcb', '4277a6f0-89cb-4876-a8a5-5cbc90bd763e', NULL, 1, '2026-08-29 09:07:35.088388+00', '2026-08-29 09:07:35.088388+00'),
	('8f4e5c23-0f3c-4611-8767-60e6336f8a42', 'fa6744c8-ee41-4722-aaf3-48783b3d524e', '4ac34cfa-ba19-466a-9934-18f6f158014c', NULL, 1, '2026-08-29 09:56:58.234884+00', '2026-08-29 09:56:58.234884+00'),
	('bfa07818-8ed7-4498-92d8-b527e7fcac9d', 'd8259f41-fdd3-4ce3-a4f6-5e53c1ea6fb6', '8bf83a5d-08d1-4b1f-ac62-f0bf1937c06a', NULL, 1, '2026-08-29 09:57:47.721086+00', '2026-08-29 09:57:47.721086+00'),
	('4bdfee36-4fcb-45ef-bceb-6543f325a6f4', 'a3dc3570-7d47-4989-bfeb-16654c9c2087', '21171b6e-24b2-4a29-8f78-7ddffc03542e', NULL, 1, '2026-08-29 11:05:56.219808+00', '2026-08-29 11:05:56.219808+00'),
	('45cc64a8-32bc-4f88-a886-e681631efab6', '37681b24-6a04-4002-85d6-5aeb7c438727', '2708d075-3f21-41c8-b17e-c3258016b211', NULL, 1, '2026-08-29 11:08:19.327653+00', '2026-08-29 11:08:19.327653+00'),
	('2f9599aa-c03b-49d9-a361-d6684a76e874', '49173a6b-e1f8-47a0-8975-b8c7cd30781f', 'ff8236b0-966d-43ce-8ec3-22ba1dc72ea4', NULL, 1, '2026-08-29 11:09:00.536763+00', '2026-08-29 11:09:00.536763+00');


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."orders" ("id", "order_number", "user_id", "guest_email", "guest_phone", "status", "payment_status", "subtotal", "discount_amount", "shipping_amount", "tax_amount", "total_amount", "currency", "shipping_address", "billing_address", "shipping_method", "coupon_code", "coupon_discount", "customer_notes", "admin_notes", "created_at", "updated_at") VALUES
	('adaabbb8-1765-44a1-a6f9-91e2100eab3b', 'ORD-CONST-1788001697554', NULL, NULL, NULL, 'pending', 'pending', 100.00, 0.00, 0.00, 0.00, 100.00, 'USD', '{}', '{}', '{}', NULL, 0.00, NULL, NULL, '2026-08-29 11:08:19.075395+00', '2026-08-29 11:08:19.075395+00'),
	('9aa6913a-b18d-4642-8687-486f949ff59e', 'RLS-TEST-1788001702731', '8c61aa42-04e8-4d58-a3b1-7eebbb8d6da5', NULL, NULL, 'pending', 'pending', 100.00, 0.00, 0.00, 0.00, 100.00, 'USD', '{}', '{}', '{}', NULL, 0.00, NULL, NULL, '2026-08-29 11:08:22.750846+00', '2026-08-29 11:08:22.750846+00'),
	('1ca6a3c0-570c-4abe-b2ba-0e871062a187', 'ORD-CONST-1788001739957', NULL, NULL, NULL, 'pending', 'pending', 100.00, 0.00, 0.00, 0.00, 100.00, 'USD', '{}', '{}', '{}', NULL, 0.00, NULL, NULL, '2026-08-29 11:09:00.217604+00', '2026-08-29 11:09:00.217604+00'),
	('52732f5c-e228-4792-ac93-436154ab1316', 'RLS-TEST-1788001741061', '83681d1e-16f3-4b9a-9bd2-83d0ea9204a3', NULL, NULL, 'pending', 'pending', 100.00, 0.00, 0.00, 0.00, 100.00, 'USD', '{}', '{}', '{}', NULL, 0.00, NULL, NULL, '2026-08-29 11:09:01.063368+00', '2026-08-29 11:09:01.063368+00'),
	('6f364494-d49d-4271-b82a-6b236b00ce9a', 'AURA-990211', NULL, 'test-1788004020614@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 11:47:05.280596+00', '2026-08-29 11:47:05.280596+00'),
	('ff518ba0-42c9-4678-a79c-809bed1dec9d', 'AURA-343328', NULL, 'test-1788004981884@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:03:02.590172+00', '2026-08-29 12:03:02.590172+00'),
	('f4783060-d509-4571-b5ca-bc4c90915305', 'AURA-656375', NULL, 'test-1788007415462@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:43:38.651511+00', '2026-08-29 12:43:38.651511+00'),
	('a0ccd6d7-5453-4359-bdeb-778aadb0bf0d', 'AURA-113655', NULL, 'test-1788007734110@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:48:57.956389+00', '2026-08-29 12:48:57.956389+00'),
	('17f60525-1280-4b09-ade1-b648f1782eb7', 'AURA-768406', NULL, 'hacker@example.com', '1234567890', 'pending', 'pending', 100.00, 0.00, 15.00, 8.50, 123.50, 'USD', '{"city": "Hackville", "type": "shipping", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"city": "Hackville", "type": "billing", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 15, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:49:01.208103+00', '2026-08-29 12:49:01.208103+00'),
	('ecd0592d-564a-4884-8cfa-b4a79bfa1214', 'AURA-470558', NULL, 'hacker@example.com', '1234567890', 'pending', 'pending', 100.00, 0.00, 15.00, 8.50, 123.50, 'USD', '{"city": "Hackville", "type": "shipping", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"city": "Hackville", "type": "billing", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 15, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:50:50.286351+00', '2026-08-29 12:50:50.286351+00'),
	('fdd84b20-36ad-465c-b3af-64fbe781d518', 'AURA-775579', NULL, 'test-1788007851418@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:50:55.908142+00', '2026-08-29 12:50:55.908142+00'),
	('953cae2f-542a-4106-a856-b2af190cc7fb', 'AURA-989632', NULL, 'hacker@example.com', '1234567890', 'pending', 'pending', 100.00, 0.00, 15.00, 8.50, 123.50, 'USD', '{"city": "Hackville", "type": "shipping", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"city": "Hackville", "type": "billing", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 15, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:52:45.250904+00', '2026-08-29 12:52:45.250904+00'),
	('86196044-aae3-4aeb-a342-3ff529707978', 'AURA-640016', NULL, 'test-1788007972035@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:52:53.338446+00', '2026-08-29 12:52:53.338446+00'),
	('3746ad25-50c1-48c3-87e2-72da9d901ace', 'AURA-537436', NULL, 'hacker@example.com', '1234567890', 'pending', 'pending', 100.00, 0.00, 15.00, 8.50, 123.50, 'USD', '{"city": "Hackville", "type": "shipping", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"city": "Hackville", "type": "billing", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 15, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:56:11.012427+00', '2026-08-29 12:56:11.012427+00'),
	('681ace6c-f1d8-4fc1-a68d-aa58285c24b8', 'AURA-958569', NULL, 'test-1788008172799@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:56:15.747174+00', '2026-08-29 12:56:15.747174+00'),
	('b5d607f9-41bf-40fb-a4b6-2e356ce29ac2', 'AURA-153912', NULL, 'hacker@example.com', '1234567890', 'pending', 'pending', 100.00, 0.00, 15.00, 8.50, 123.50, 'USD', '{"city": "Hackville", "type": "shipping", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"city": "Hackville", "type": "billing", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 15, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:58:06.008297+00', '2026-08-29 12:58:06.008297+00'),
	('b8ad6555-5d9d-41d1-b5a2-6aa1fc46a8f1', 'AURA-123526', NULL, 'test-1788008297204@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 12:58:20.242456+00', '2026-08-29 12:58:20.242456+00'),
	('dda6c216-3c07-4417-8a12-fbd1efe6cc28', 'AURA-946462', NULL, 'hacker@example.com', '1234567890', 'pending', 'pending', 100.00, 0.00, 15.00, 8.50, 123.50, 'USD', '{"city": "Hackville", "type": "shipping", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"city": "Hackville", "type": "billing", "phone": "1234567890", "state": "NY", "country": "US", "address_1": "123 Fake St", "last_name": "User", "first_name": "Hacker", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 15, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 13:03:34.088833+00', '2026-08-29 13:03:34.088833+00'),
	('f1b2910a-9a22-4681-9938-e859b6a2dc17', 'AURA-401009', NULL, 'test-1788008616712@example.com', '+1234567890', 'pending', 'pending', 250.00, 0.00, 0.00, 21.25, 271.25, 'USD', '{"city": "Test City", "type": "shipping", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"city": "Test City", "type": "billing", "phone": "+1234567890", "state": "NY", "country": "US", "address_1": "123 Test St", "last_name": "User", "first_name": "Test", "postal_code": "10001"}', '{"id": "zone-standard", "rate": 0, "title": "Standard Ground Shipping"}', NULL, 0.00, NULL, NULL, '2026-08-29 13:03:43.73245+00', '2026-08-29 13:03:43.73245+00');


--
-- Data for Name: coupon_usages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: homepage_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."homepage_sections" ("id", "section_type", "title", "subtitle", "content", "image_url", "settings", "display_order", "is_enabled", "created_at", "updated_at") VALUES
	('7ab23253-3130-40a1-81d1-a149b3c84ae5', 'featured_products', 'Featured', NULL, '{}', NULL, '{}', 1, true, '2026-08-29 11:28:07.437484+00', '2026-08-29 11:28:07.437484+00');


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."inventory_transactions" ("id", "product_id", "variant_id", "quantity_change", "transaction_type", "reference_id", "note", "created_at") VALUES
	('3ae0c8aa-8df7-42d4-aa67-5b8cc61c3f6d', '92654dca-c933-4513-a3bf-c440193d7d3e', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_1_1787992657752', '2026-08-29 08:37:37.813772+00'),
	('d95b98bf-30e1-404e-9dc4-1084f00f2c43', '92654dca-c933-4513-a3bf-c440193d7d3e', NULL, 1, 'cancellation', 'ord_test_concurrent_1_1787992657752', 'Released reservation', '2026-08-29 08:37:38.1035+00'),
	('2fc8d347-8c8e-4217-8599-dff47d07e995', 'aee2c808-6706-46e6-9131-e9c76e0b4720', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_1_1787992714876', '2026-08-29 08:38:34.926795+00'),
	('644ebcaa-7618-47c7-a1a6-1748c92aa54f', 'aee2c808-6706-46e6-9131-e9c76e0b4720', NULL, 1, 'cancellation', 'ord_test_concurrent_1_1787992714876', 'Released reservation', '2026-08-29 08:38:35.17863+00'),
	('54c37e93-0f4c-4304-a49f-913f3d79350a', '7398039f-812a-4265-b621-c10fb215cce9', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_2_1787992738768', '2026-08-29 08:38:58.796517+00'),
	('79730502-eac2-4054-bf68-bf7876f2017b', '7398039f-812a-4265-b621-c10fb215cce9', NULL, 1, 'cancellation', 'ord_test_concurrent_2_1787992738768', 'Released reservation', '2026-08-29 08:38:58.947171+00'),
	('b2ca7199-47ff-428f-8fc6-ca1d3f12f73c', 'c65b623f-bacf-4389-9b0f-f28f57f6286a', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_2_1787994440419', '2026-08-29 09:07:21.603438+00'),
	('0a0347c8-91cb-4949-8cc5-8ece8413ed72', 'c65b623f-bacf-4389-9b0f-f28f57f6286a', NULL, 1, 'cancellation', 'ord_test_concurrent_2_1787994440419', 'Released reservation', '2026-08-29 09:07:21.962594+00'),
	('e7dcaa45-6b6e-4ddd-9972-231e6576713d', '4eabcb1c-4d27-49dd-aaba-d86b26a81207', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_1_1787994454838', '2026-08-29 09:07:34.171698+00'),
	('aa7ce546-6b4d-4717-a4db-18e6e39f1cf2', '4eabcb1c-4d27-49dd-aaba-d86b26a81207', NULL, 1, 'cancellation', 'ord_test_concurrent_1_1787994454838', 'Released reservation', '2026-08-29 09:07:35.443731+00'),
	('6cdf0e4a-7b82-49f9-9194-246a3af0f358', '818c6bf2-a3f7-4d5d-875b-e4e412112551', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_1_1787997418195', '2026-08-29 09:56:58.229511+00'),
	('48f1f79c-5185-4776-982f-355540c3d0ca', '818c6bf2-a3f7-4d5d-875b-e4e412112551', NULL, 1, 'cancellation', 'ord_test_concurrent_1_1787997418195', 'Released reservation', '2026-08-29 09:56:58.373946+00'),
	('e0bc6062-c750-4faf-bd61-49ddb4e1bb3d', 'b9344257-5d4a-468d-b8a2-72e67aa4509e', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_1_1787997467628', '2026-08-29 09:57:47.641143+00'),
	('6b032016-4ef3-48eb-9564-7c1040bfae41', 'b9344257-5d4a-468d-b8a2-72e67aa4509e', NULL, 1, 'cancellation', 'ord_test_concurrent_1_1787997467628', 'Released reservation', '2026-08-29 09:57:47.78542+00'),
	('64300b56-05a5-482e-a63c-706a1311e724', 'e9f9afd1-6b70-482f-98c0-495b796ad9d4', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_2_1788001556124', '2026-08-29 11:05:56.144272+00'),
	('bca1851b-0d65-4bc7-92a8-7601da59e315', 'e9f9afd1-6b70-482f-98c0-495b796ad9d4', NULL, 1, 'cancellation', 'ord_test_concurrent_2_1788001556124', 'Released reservation', '2026-08-29 11:05:56.258729+00'),
	('317f17c5-f200-436c-b697-eb1d40d89325', 'c97fcc2e-0e6b-40f7-8df2-67e847405537', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_2_1788001699212', '2026-08-29 11:08:19.248673+00'),
	('db9bcca4-59ac-4bf6-86d6-07bd291c8a6b', 'c97fcc2e-0e6b-40f7-8df2-67e847405537', NULL, 1, 'cancellation', 'ord_test_concurrent_2_1788001699212', 'Released reservation', '2026-08-29 11:08:19.541572+00'),
	('a8ab5a8c-0c62-44de-8812-3561e1c1f652', '22570b79-40d7-402b-859b-9fb552cd1b01', NULL, -1, 'sale', NULL, 'Reservation ord_test_concurrent_1_1788001740418', '2026-08-29 11:09:00.440213+00'),
	('c23ecb4f-7dbd-469f-aeca-55b1f02e3a82', '22570b79-40d7-402b-859b-9fb552cd1b01', NULL, 1, 'cancellation', 'ord_test_concurrent_1_1788001740418', 'Released reservation', '2026-08-29 11:09:00.594144+00'),
	('1fb8d844-1ed3-4ce1-8abb-f7a1737e1ed6', 'c722cfc3-df77-4bf2-934b-a274516f3be8', NULL, -1, 'sale', NULL, 'Reservation AURA-990211', '2026-08-29 11:47:04.59315+00'),
	('dcb220cd-7d72-4e4d-be45-884801ab2246', 'a1b17281-1fd0-480e-b940-666b5f5fb036', NULL, -1, 'sale', NULL, 'Reservation AURA-343328', '2026-08-29 12:03:02.473901+00'),
	('7c1b6f8d-83b1-415e-b4af-3fef284af898', '9565a18b-4276-4746-a1fd-03c0489a0eb7', NULL, -1, 'sale', NULL, 'Reservation AURA-656375', '2026-08-29 12:43:38.39015+00'),
	('fdc6ffca-c3ec-419b-9a59-73041bdf3be7', '7daa813f-a11c-421d-a55f-d14c926bd6b5', NULL, -1, 'sale', NULL, 'Reservation AURA-113655', '2026-08-29 12:48:57.685002+00'),
	('d2a2a7cc-60f6-4522-994a-e149664d6ad7', 'c8e074dc-108f-4481-9867-37f151a8feb6', NULL, -1, 'sale', NULL, 'Reservation AURA-768406', '2026-08-29 12:49:00.442737+00'),
	('97f5a899-05e2-466e-b628-1006fe214e57', 'a5d6475e-a667-4c6a-a2f0-3ee790b6f610', NULL, -1, 'sale', NULL, 'Reservation AURA-470558', '2026-08-29 12:50:49.081354+00'),
	('f76da094-fe36-4f29-b88d-af94fbaf4a06', '220b82f1-e640-4a3e-b8f0-48fe7d8d155a', NULL, -1, 'sale', NULL, 'Reservation AURA-775579', '2026-08-29 12:50:55.680848+00'),
	('d424b4ae-b2e2-44e7-8e7d-ca1dbf4dfebb', '1bf2db6c-b2aa-4045-88a0-9ba1f78cd456', NULL, -1, 'sale', NULL, 'Reservation AURA-989632', '2026-08-29 12:52:43.319182+00'),
	('dcc2b96f-b0b1-44e2-b646-4c178b9c19da', '21a11527-26ce-4afa-bc23-d1373bd2fa10', NULL, -1, 'sale', NULL, 'Reservation AURA-640016', '2026-08-29 12:52:53.238192+00'),
	('f1df7842-9e14-470e-97e1-8d2c73f4bd96', '795f2a67-2d5a-4fa8-81ca-bd59e61731e2', NULL, -1, 'sale', NULL, 'Reservation AURA-537436', '2026-08-29 12:56:10.876877+00'),
	('b8c6fc63-e572-4beb-89f9-85377fbab863', 'e5bdfa3c-2708-4ca1-b009-22ba003ca3b1', NULL, -1, 'sale', NULL, 'Reservation AURA-958569', '2026-08-29 12:56:15.630885+00'),
	('dcce96a3-c41e-4df4-b171-f4579e522436', '9055495a-6ec6-4ab5-abac-58215d481393', NULL, -1, 'sale', NULL, 'Reservation AURA-153912', '2026-08-29 12:58:05.79234+00'),
	('5efdd6ed-589e-41c3-96f3-aed2959c94ac', '1f395d0a-0c93-4b93-87df-e75a0bf4340c', NULL, -1, 'sale', NULL, 'Reservation AURA-123526', '2026-08-29 12:58:18.766738+00'),
	('3857d575-c035-40db-9d4d-1763edaa69f2', 'fad17d98-4e86-42b3-9c9e-f6c62e9be357', NULL, -1, 'sale', NULL, 'Reservation AURA-946462', '2026-08-29 13:03:33.455385+00'),
	('16bb1b7e-001e-4a5a-b380-9e4a00d6777e', '208cfb72-dcec-40b9-82d3-a13e4cb89d2e', NULL, -1, 'sale', NULL, 'Reservation AURA-401009', '2026-08-29 13:03:43.714777+00');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_items" ("id", "order_id", "product_id", "variant_id", "product_name_snapshot", "sku_snapshot", "price_snapshot", "image_snapshot", "quantity", "total_price", "attributes_snapshot", "created_at") VALUES
	('e518fd1a-3f9f-4116-b872-ae9e3125cbb5', '6f364494-d49d-4271-b82a-6b236b00ce9a', 'c722cfc3-df77-4bf2-934b-a274516f3be8', NULL, 'E2E Test Product', 'e2e-cust-prod-1788004011181', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 11:47:05.758214+00'),
	('21f0ae6a-c766-446a-8a00-e26aba94b83e', 'ff518ba0-42c9-4678-a79c-809bed1dec9d', 'a1b17281-1fd0-480e-b940-666b5f5fb036', NULL, 'E2E Test Product', 'e2e-cust-prod-1788004967382', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:03:02.684326+00'),
	('d0dcd4b0-c592-44a5-978c-87e1fcf42b07', 'f4783060-d509-4571-b5ca-bc4c90915305', '9565a18b-4276-4746-a1fd-03c0489a0eb7', NULL, 'E2E Test Product', 'e2e-cust-prod-1788007401360', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:43:38.855273+00'),
	('7d60475a-6892-435f-93c9-f1b3b2b7b2b2', 'a0ccd6d7-5453-4359-bdeb-778aadb0bf0d', '7daa813f-a11c-421d-a55f-d14c926bd6b5', NULL, 'E2E Test Product', 'e2e-cust-prod-1788007724680', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:48:58.111363+00'),
	('0a9683d8-972f-4571-afd7-d48079372e5e', '17f60525-1280-4b09-ade1-b648f1782eb7', 'c8e074dc-108f-4481-9867-37f151a8feb6', NULL, 'Tamper Test Product', 'e2e-tamper-1788007718988', 100.00, NULL, 1, 100.00, '{}', '2026-08-29 12:49:02.159841+00'),
	('9a96844f-00e3-4c54-818b-b424625e5beb', 'ecd0592d-564a-4884-8cfa-b4a79bfa1214', 'a5d6475e-a667-4c6a-a2f0-3ee790b6f610', NULL, 'Tamper Test Product', 'e2e-tamper-1788007839183', 100.00, NULL, 1, 100.00, '{}', '2026-08-29 12:50:50.648903+00'),
	('30791fb2-cd0c-4c8b-b938-89d2e343e69b', 'fdd84b20-36ad-465c-b3af-64fbe781d518', '220b82f1-e640-4a3e-b8f0-48fe7d8d155a', NULL, 'E2E Test Product', 'e2e-cust-prod-1788007842384', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:50:56.202749+00'),
	('30fd5628-0815-4d81-954e-d4dbb55db9c2', '953cae2f-542a-4106-a856-b2af190cc7fb', '1bf2db6c-b2aa-4045-88a0-9ba1f78cd456', NULL, 'Tamper Test Product', 'e2e-tamper-1788007954393', 100.00, NULL, 1, 100.00, '{}', '2026-08-29 12:52:45.941109+00'),
	('9b2fa0ae-3f89-4255-aa4d-097d61906c49', '86196044-aae3-4aeb-a342-3ff529707978', '21a11527-26ce-4afa-bc23-d1373bd2fa10', NULL, 'E2E Test Product', 'e2e-cust-prod-1788007960887', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:52:53.427068+00'),
	('53675e5a-73cd-4222-a98e-dc257806ee7b', '3746ad25-50c1-48c3-87e2-72da9d901ace', '795f2a67-2d5a-4fa8-81ca-bd59e61731e2', NULL, 'Tamper Test Product', 'e2e-tamper-1788008157183', 100.00, NULL, 1, 100.00, '{}', '2026-08-29 12:56:11.198219+00'),
	('50ab8eac-169a-42ab-ba30-ed4f8f1787b0', '681ace6c-f1d8-4fc1-a68d-aa58285c24b8', 'e5bdfa3c-2708-4ca1-b009-22ba003ca3b1', NULL, 'E2E Test Product', 'e2e-cust-prod-1788008164011', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:56:15.801856+00'),
	('861845a3-7c1c-4b14-9c59-56cb60808347', 'b5d607f9-41bf-40fb-a4b6-2e356ce29ac2', '9055495a-6ec6-4ab5-abac-58215d481393', NULL, 'Tamper Test Product', 'e2e-tamper-1788008277584', 100.00, NULL, 1, 100.00, '{}', '2026-08-29 12:58:06.137304+00'),
	('ae06381a-b5ff-4736-b891-9302815f444a', 'b8ad6555-5d9d-41d1-b5a2-6aa1fc46a8f1', '1f395d0a-0c93-4b93-87df-e75a0bf4340c', NULL, 'E2E Test Product', 'e2e-cust-prod-1788008282318', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 12:58:20.895279+00'),
	('15157ab0-067f-4721-93ef-1f449669d106', 'dda6c216-3c07-4417-8a12-fbd1efe6cc28', 'fad17d98-4e86-42b3-9c9e-f6c62e9be357', NULL, 'Tamper Test Product', 'e2e-tamper-1788008602363', 100.00, NULL, 1, 100.00, '{}', '2026-08-29 13:03:35.927443+00'),
	('f3872f84-e156-4dc3-8c84-f4fda7b0427d', 'f1b2910a-9a22-4681-9938-e859b6a2dc17', '208cfb72-dcec-40b9-82d3-a13e4cb89d2e', NULL, 'E2E Test Product', 'e2e-cust-prod-1788008605126', 250.00, NULL, 1, 250.00, '{}', '2026-08-29 13:03:43.748234+00');


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_status_history" ("id", "order_id", "status", "notes", "changed_by", "created_at") VALUES
	('ee685e7d-47f5-4810-a626-060fedbd992f', '6f364494-d49d-4271-b82a-6b236b00ce9a', 'pending', 'Order created', NULL, '2026-08-29 11:47:06.046223+00'),
	('3b617149-581d-49df-ae11-c315a500c2f7', 'ff518ba0-42c9-4678-a79c-809bed1dec9d', 'pending', 'Order created', NULL, '2026-08-29 12:03:02.731862+00'),
	('c0c09732-0afc-4959-9653-7e0c88d33325', 'f4783060-d509-4571-b5ca-bc4c90915305', 'pending', 'Order created', NULL, '2026-08-29 12:43:39.086383+00'),
	('d15c6434-5bb4-48b6-9607-eca6a4707acd', 'a0ccd6d7-5453-4359-bdeb-778aadb0bf0d', 'pending', 'Order created', NULL, '2026-08-29 12:48:59.824826+00'),
	('4b270714-134d-4b68-9fd6-49e1f6fb6d92', '17f60525-1280-4b09-ade1-b648f1782eb7', 'pending', 'Order created', NULL, '2026-08-29 12:49:02.308941+00'),
	('31862e33-3907-4c5b-b5c7-f5c3b8cad470', 'ecd0592d-564a-4884-8cfa-b4a79bfa1214', 'pending', 'Order created', NULL, '2026-08-29 12:50:50.779515+00'),
	('dbcc005c-f18c-4679-a8f7-0481bd1ef367', 'fdd84b20-36ad-465c-b3af-64fbe781d518', 'pending', 'Order created', NULL, '2026-08-29 12:50:56.546548+00'),
	('02f9a70b-37d3-4e7b-8c9b-71c9d8d56516', '953cae2f-542a-4106-a856-b2af190cc7fb', 'pending', 'Order created', NULL, '2026-08-29 12:52:46.600245+00'),
	('55238600-6e24-45de-9354-75ee1f8e6f60', '86196044-aae3-4aeb-a342-3ff529707978', 'pending', 'Order created', NULL, '2026-08-29 12:52:53.510032+00'),
	('ff2e9d39-2e04-48d7-a399-5ffc68af965c', '3746ad25-50c1-48c3-87e2-72da9d901ace', 'pending', 'Order created', NULL, '2026-08-29 12:56:11.281417+00'),
	('2dd65c74-4cc5-48c6-8ca3-c05489e621fb', '681ace6c-f1d8-4fc1-a68d-aa58285c24b8', 'pending', 'Order created', NULL, '2026-08-29 12:56:15.843642+00'),
	('0704a9b5-d250-44bc-acd5-1d4b6bb097a0', 'b5d607f9-41bf-40fb-a4b6-2e356ce29ac2', 'pending', 'Order created', NULL, '2026-08-29 12:58:06.384069+00'),
	('e86e338d-19fb-498c-bd5a-d29c579a37eb', 'b8ad6555-5d9d-41d1-b5a2-6aa1fc46a8f1', 'pending', 'Order created', NULL, '2026-08-29 12:58:21.253441+00'),
	('856c8be9-6077-49d3-9608-6d941d4c58e5', 'dda6c216-3c07-4417-8a12-fbd1efe6cc28', 'pending', 'Order created', NULL, '2026-08-29 13:03:36.427388+00'),
	('4a6a4cc3-1727-4010-8bd7-f0a3eff6ddc3', 'f1b2910a-9a22-4681-9938-e859b6a2dc17', 'pending', 'Order created', NULL, '2026-08-29 13:03:43.76282+00');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."payments" ("id", "order_id", "payment_provider", "provider_order_id", "transaction_id", "amount", "currency", "status", "signature", "payload", "created_at", "updated_at") VALUES
	('55378971-b449-4ca3-be7b-aa63cbfca187', 'f4783060-d509-4571-b5ca-bc4c90915305', 'mock', 'mock_ord_1788007420017', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007420017", "currency": "USD", "testMode": true}', '2026-08-29 12:43:40.117149+00', '2026-08-29 12:43:40.117149+00'),
	('ffe26075-44f3-413a-840c-13bd3a1368f7', 'a0ccd6d7-5453-4359-bdeb-778aadb0bf0d', 'mock', 'mock_ord_1788007740576', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007740576", "currency": "USD", "testMode": true}', '2026-08-29 12:49:00.591453+00', '2026-08-29 12:49:00.591453+00'),
	('06475e47-e659-401d-8651-11be9fa47778', '17f60525-1280-4b09-ade1-b648f1782eb7', 'mock', 'mock_ord_1788007742678', NULL, 123.50, 'USD', 'pending', NULL, '{"amount": 123.5, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007742678", "currency": "USD", "testMode": true}', '2026-08-29 12:49:02.787594+00', '2026-08-29 12:49:02.787594+00'),
	('bf9d9188-9b0d-4b0d-b734-b98358f800d4', 'ecd0592d-564a-4884-8cfa-b4a79bfa1214', 'mock', 'mock_ord_1788007851027', NULL, 123.50, 'USD', 'pending', NULL, '{"amount": 123.5, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007851027", "currency": "USD", "testMode": true}', '2026-08-29 12:50:50.977772+00', '2026-08-29 12:50:50.977772+00'),
	('f5f2b8de-4d77-414b-a32e-f6b7bd20f402', 'fdd84b20-36ad-465c-b3af-64fbe781d518', 'mock', 'mock_ord_1788007856811', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007856811", "currency": "USD", "testMode": true}', '2026-08-29 12:50:56.754146+00', '2026-08-29 12:50:56.754146+00'),
	('730a537f-93d8-4576-bd67-e205a52c3d20', '953cae2f-542a-4106-a856-b2af190cc7fb', 'mock', 'mock_ord_1788007967267', NULL, 123.50, 'USD', 'pending', NULL, '{"amount": 123.5, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007967267", "currency": "USD", "testMode": true}', '2026-08-29 12:52:47.288787+00', '2026-08-29 12:52:47.288787+00'),
	('7aed6d16-0b12-44eb-b4f6-502d67cd526e', '86196044-aae3-4aeb-a342-3ff529707978', 'mock', 'mock_ord_1788007973643', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788007973643", "currency": "USD", "testMode": true}', '2026-08-29 12:52:53.631635+00', '2026-08-29 12:52:53.631635+00'),
	('fef7106d-0588-420a-a65a-e6b9f8172e26', '3746ad25-50c1-48c3-87e2-72da9d901ace', 'mock', 'mock_ord_1788008171349', NULL, 123.50, 'USD', 'pending', NULL, '{"amount": 123.5, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788008171349", "currency": "USD", "testMode": true}', '2026-08-29 12:56:11.349505+00', '2026-08-29 12:56:11.349505+00'),
	('2a37ee0f-ce80-421c-95f2-3bc734d36ae0', '681ace6c-f1d8-4fc1-a68d-aa58285c24b8', 'mock', 'mock_ord_1788008175949', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788008175949", "currency": "USD", "testMode": true}', '2026-08-29 12:56:15.935603+00', '2026-08-29 12:56:15.935603+00'),
	('a25e90ec-f919-4195-98bf-3284917a34dc', 'b5d607f9-41bf-40fb-a4b6-2e356ce29ac2', 'mock', 'mock_ord_1788008286966', NULL, 123.50, 'USD', 'pending', NULL, '{"amount": 123.5, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788008286966", "currency": "USD", "testMode": true}', '2026-08-29 12:58:07.003149+00', '2026-08-29 12:58:07.003149+00'),
	('d0f8742a-a3ff-4829-8195-994d75470356', 'b8ad6555-5d9d-41d1-b5a2-6aa1fc46a8f1', 'mock', 'mock_ord_1788008301600', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788008301600", "currency": "USD", "testMode": true}', '2026-08-29 12:58:21.686917+00', '2026-08-29 12:58:21.686917+00'),
	('8562428b-f344-47bb-8911-9b7e775b1b3f', 'dda6c216-3c07-4417-8a12-fbd1efe6cc28', 'mock', 'mock_ord_1788008617052', NULL, 123.50, 'USD', 'pending', NULL, '{"amount": 123.5, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788008617052", "currency": "USD", "testMode": true}', '2026-08-29 13:03:37.091514+00', '2026-08-29 13:03:37.091514+00'),
	('5bfeaf54-9834-44c1-bf89-2cf8596565ba', 'f1b2910a-9a22-4681-9938-e859b6a2dc17', 'mock', 'mock_ord_1788008623773', NULL, 271.25, 'USD', 'pending', NULL, '{"amount": 271.25, "message": "Test Payment Gateway Active", "orderId": "mock_ord_1788008623773", "currency": "USD", "testMode": true}', '2026-08-29 13:03:43.78814+00', '2026-08-29 13:03:43.78814+00');


--
-- Data for Name: processed_webhooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."processed_webhooks" ("id", "provider", "event_id", "event_type", "payload", "processed_at") VALUES
	('4d3395c6-2511-41c4-9e5a-ceeaa1caab6d', 'razorpay', 'evt_1788001699330', 'payment.captured', '{}', '2026-08-29 11:08:19.344032+00'),
	('0c7c2d3d-0910-4d8f-9c04-3e2181d9d298', 'razorpay', 'evt_1788001740311', 'payment.captured', '{}', '2026-08-29 11:09:00.325813+00');


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: store_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 75, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
