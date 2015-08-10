<?php
/****************************************************************************************
* LiveZilla definitions.protocol.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
***************************************************************************************/ 

define("GET_INDEX_SERVER_ACTION","action");
define("GET_INTERN_COBROWSE","lzcobrowse");
define("GET_EXTERN_USER_NAME","en");
define("GET_EXTERN_USER_EMAIL","ee");
define("GET_EXTERN_USER_COMPANY","ec");
define("GET_EXTERN_USER_LANGUAGE","el");
define("GET_EXTERN_USER_HEADER","eh");
define("GET_EXTERN_USER_QUESTION","eq");
define("GET_EXTERN_DOCUMENT_TITLE","dc");
define("GET_EXTERN_RESET","mp");
define("GET_EXTERN_GROUP","intgroup");
define("GET_EXTERN_INTERN_USER_ID","intid");
define("GET_EXTERN_PREFERENCE","pref");
define("GET_EXTERN_HIDDEN_GROUPS","hg");
define("GET_EXTERN_DYNAMIC_GROUP","edg");
define("GET_EXTERN_TEMPLATE","template");

define("GET_TRACK_BROWSERID","b");
define("GET_TRACK_USERID","i");
define("GET_TRACK_CHATID","c");
define("GET_TRACK_RESOLUTION_WIDTH","rw");
define("GET_TRACK_RESOLUTION_HEIGHT","rh");
define("GET_TRACK_COLOR_DEPTH","cd");
define("GET_TRACK_TIMEZONE_OFFSET","tzo");
define("GET_TRACK_REFERRER","rf");
define("GET_TRACK_URL","ue");
define("GET_TRACK_START","start");
define("GET_TRACK_WEBSITE_PUSH_ACCEPTED","accwp");
define("GET_TRACK_WEBSITE_PUSH_DECLINED","decwp");
define("GET_TRACK_SPECIAL_AREA_CODE","code");
define("GET_TRACK_OUTPUT_TYPE","output");
define("GET_TRACK_NO_SEARCH_ENGINE","nse");
define("GEO_LATITUDE","geo_lat");
define("GEO_LONGITUDE","geo_long");
define("GEO_CITY","geo_city");
define("GEO_REGION","geo_region");
define("GEO_TIMEZONE","geo_tz");
define("GEO_SSPAN","geo_ss");
define("GEO_COUNTRY_ISO_2","geo_ctryiso");
define("GEO_RESULT_ID","geo_rid");
define("GEO_ISP","geo_isp");

// POST
define("POST_GLOBAL_TYPING","p_typing");
define("POST_GLOBAL_SHOUT","p_shout");
define("POST_GLOBAL_NO_LONG_POLL","p_lcf");
define("POST_GLOBAL_XMLCLIP_HASH_ALL","p_gl_a");
define("POST_INTERN_XMLCLIP_HASH_EXECUTION_TIME","p_gl_et");
define("POST_INTERN_XMLCLIP_RATING_END_TIME","p_ext_re");
define("POST_INTERN_XMLCLIP_ARCHIVE_END_TIME","p_ext_ce");
define("POST_INTERN_XMLCLIP_RESOURCES_END_TIME","p_ext_rse");
define("POST_INTERN_XMLCLIP_REPORTS_END_TIME","p_st_r");
define("POST_INTERN_XMLCLIP_TICKETS_END_TIME","p_ext_me");
define("POST_INTERN_XMLCLIP_TICKETS_STATUS_END_TIME","p_ext_tse");
define("POST_INTERN_XMLCLIP_TICKETS_LOG_END_TIME","p_ext_tle");
define("POST_INTERN_XMLCLIP_TICKETS_COMMENTS_END_TIME","p_ext_tce");
define("POST_INTERN_XMLCLIP_EMAILS_END_TIME","p_ma_me");

define("POST_INTERN_DUT_CHATS","p_dut_c");
define("POST_INTERN_DUT_TICKETS","p_dut_t");
define("POST_INTERN_DUT_REPORTS","p_dut_r");
define("POST_INTERN_DUT_FEEDBACKS","p_dut_f");
define("POST_INTERN_DUT_FILTERS","p_dut_fi");
define("POST_INTERN_DUT_EMAILS","p_dut_e");
define("POST_INTERN_DUT_EVENTS","p_dut_ev");

define("POST_INTERN_SERVER_ACTION","p_action");
define("POST_INTERN_AUTHENTICATION_USER","p_user");
define("POST_INTERN_AUTHENTICATION_PASSWORD","p_pass");
define("POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID","p_loginid");
define("POST_INTERN_AUTHENTICATION_TOKEN","p_token");
define("POST_INTERN_NEW_PASSWORD","p_new_password");
define("POST_INTERN_IGNORE_SIGNED_ON","p_iso");
define("POST_INTERN_ACCESSTEST","p_accesstest");
define("POST_INTERN_RESYNC","p_resync");
define("POST_INTERN_CLIENT_TIME","p_clienttime");
define("POST_INTERN_ADMINISTRATE","p_administrate");
define("POST_INTERN_USER_STATUS","p_user_status");
define("POST_INTERN_REQUEST","p_request");
define("POST_INTERN_FILE_TYPE","p_filetype");
define("POST_INTERN_EDIT_USER","p_edit_user");
define("POST_INTERN_GET_MANAGEMENT","p_get_management");
define("POST_INTERN_DATABASE_HOST","p_db_host");
define("POST_INTERN_DATABASE_USER","p_db_user");
define("POST_INTERN_DATABASE_PASS","p_db_pass");
define("POST_INTERN_DATABASE_PREFIX","p_db_prefix");
define("POST_INTERN_DATABASE_NAME","p_db_name");
define("POST_INTERN_DATABASE_CREATE","p_db_create");
define("POST_INTERN_PROCESS_ALERTS","p_alerts");
define("POST_INTERN_PROCESS_CHAT_ACTION","p_ca");
define("POST_INTERN_PROCESS_UPDATE_REPORT","p_upd_rep");
define("POST_INTERN_PROCESS_UPDATE_REPORT_TYPE","p_upd_rep_type");
define("POST_INTERN_PROCESS_CANCEL_INVITATION","p_cncl_inv");
define("POST_INTERN_PROCESS_AUTHENTICATIONS","p_authentications");
define("POST_INTERN_PROCESS_CLOSURES","p_closures");
define("POST_INTERN_PROCESS_POSTS","p_posts");
define("POST_INTERN_PROCESS_EXTERNAL_RELOADS","p_ex_re");
define("POST_INTERN_PROCESS_FORWARDS","p_forwards");
define("POST_INTERN_PROCESS_REQUESTS","p_requests");
define("POST_INTERN_PROCESS_PERMISSIONS","p_permissions");
define("POST_INTERN_PROCESS_GUIDES","p_guides");
define("POST_INTERN_PROCESS_FILTERS","p_filters");
define("POST_INTERN_PROCESS_GOALS","p_goals");
define("POST_INTERN_PROCESS_RECEIVED_POSTS","p_rec_posts");
define("POST_INTERN_PROCESS_PROFILE","p_profile");
define("POST_INTERN_PROCESS_TICKET_ACTIONS","p_ta");
define("POST_INTERN_PROCESS_PICTURES","p_profile_pictures");
define("POST_INTERN_PROCESS_PICTURES_WEBCAM","p_webcam_pictures");
define("POST_INTERN_PROCESS_BANNERS","p_process_banners");
define("POST_INTERN_PROCESS_CHATS","p_process_chats");
define("POST_INTERN_PROCESS_RESOURCES","p_process_resources");
define("POST_INTERN_PROCESS_EVENTS","p_process_events");
define("POST_EXTERN_SERVER_ACTION","p_action");
define("POST_EXTERN_USER_BROWSERID","p_extern_browserid");
define("POST_EXTERN_USER_USERID","p_extern_userid");
define("POST_EXTERN_USER_NAME","p_username");
define("POST_EXTERN_USER_EMAIL","p_email");
define("POST_EXTERN_USER_COMPANY","p_company");
define("POST_EXTERN_USER_FILE_UPLOAD_NAME","p_fu_n");
define("POST_EXTERN_USER_FILE_UPLOAD_ERROR","p_fu_e");
define("POST_EXTERN_USER_GROUP","p_group");
define("POST_EXTERN_RATE_COMMENT","p_rate_c");
define("POST_EXTERN_RATE_POLITENESS","p_rate_p");
define("POST_EXTERN_RATE_QUALIFICATION","p_rate_q");
define("POST_EXTERN_REQUESTED_INTERNID","p_requested_intern_userid");
define("POST_EXTERN_TYPING","p_typ");
define("POST_EXTERN_RESOLUTION_WIDTH","p_resw");
define("POST_EXTERN_RESOLUTION_HEIGHT","p_resh");
define("POST_EXTERN_COLOR_DEPTH","p_cd");
define("POST_EXTERN_TIMEZONE_OFFSET","p_tzo");
define("POST_EXTERN_CHAT_ID","p_cid");
?>
