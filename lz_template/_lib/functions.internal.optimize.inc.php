<?php

/****************************************************************************************
 * LiveZilla functions.internal.optimize.inc.php
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();
	
function optimizeTables($_table)
{
	global $RESPONSE;
	if($_table == DATABASE_VISITOR_DATA_PAGES)
	{
        $result = queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."`;");
        while($row = DBManager::FetchArray($result))
        {
            $rows = DBManager::FetchArray(queryDB(true,"(SELECT COUNT(*) AS `csap` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES."` WHERE `url` = '".$row["id"]."');"));
            if(!empty($rows["csap"]))
                continue;
            $rows = DBManager::FetchArray(queryDB(true,"(SELECT COUNT(*) AS `csap` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES_EXIT."` WHERE `url` = '".$row["id"]."');"));
            if(!empty($rows["csap"]))
                continue;
            $rows = DBManager::FetchArray(queryDB(true,"(SELECT COUNT(*) AS `csap` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES_ENTRANCE."` WHERE `url` = '".$row["id"]."');"));
            if(!empty($rows["csap"]))
                continue;
            $rows = DBManager::FetchArray(queryDB(true,"(SELECT COUNT(*) AS `csap` FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE `url` = '".$row["id"]."' OR `referrer` = '".$row["id"]."');"));
            if(!empty($rows["csap"]))
                continue;
            $rows = DBManager::FetchArray(queryDB(true,"(SELECT COUNT(*) AS `csap` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_REFERRERS."` WHERE `referrer` = '".$row["id"]."');"));
            if(!empty($rows["csap"]))
                continue;
            queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` WHERE `id`='".$row["id"]."';");
        }
        queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."`;");
	}
	else if($_table == DATABASE_VISITOR_DATA_DOMAINS)
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` WHERE `domain` = `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."`.`id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS_DOMAINS."` WHERE `domain` = `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."`.`id`);");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."`;");
	}
	else if($_table == DATABASE_VISITOR_DATA_PATHS)
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` WHERE `path` = `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."`.`id`);");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."`;");
	}
	else if($_table == DATABASE_VISITOR_DATA_ISPS)
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS_ISPS."` WHERE `isp` = `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."`.`id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `isp` = `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."`.`id`);");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."`;");
	}
	else if($_table == DATABASE_VISITOR_DATA_QUERIES)
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS_QUERIES."` WHERE `query` = `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."`.`id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `query` = `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."`.`id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS_GOALS_QUERIES."` WHERE `query` = `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."`.`id`);");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."`;");
	}
	else if($_table == DATABASE_VISITOR_DATA_CITIES)
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS_CITIES."` WHERE `city` = `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."`.`id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `city` = `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."`.`id`);");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."`;");
	}
	else if($_table == DATABASE_VISITOR_DATA_REGIONS)
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS_REGIONS."` WHERE `region` = `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."`.`id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `region` = `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."`.`id`);");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."`;");
	}
	else if($_table == DATABASE_VISITORS)
	{
        queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_DATA_CACHE."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_POSTS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_TICKETS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_TICKET_MESSAGES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_TICKET_EDITORS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_CHAT_REQUESTS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_RESOLUTIONS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITORS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_FILTERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_CHATS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_CHATS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`;");
        queryDB(true,"REPAIR TABLE `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_OPERATOR_STATUS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_OPERATORS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_VISITOR_GOALS."`;");
	}
	else if($_table == DATABASE_STATS_AGGS)
	{
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_BROWSERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_RESOLUTIONS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_COUNTRIES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_VISITS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_SYSTEMS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_LANGUAGES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_CITIES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_REGIONS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_ISPS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_QUERIES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_DOMAINS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_REFERRERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_AVAILABILITIES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_DURATIONS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_CHATS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_SEARCH_ENGINES."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_VISITORS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_CRAWLERS."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES_ENTRANCE."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES_EXIT."`;");
		queryDB(true,"OPTIMIZE TABLE `".DB_PREFIX.DATABASE_STATS_AGGS_GOALS."`;");
	}
	$RESPONSE->SetStandardResponse(1,base64_encode(1));
}

function maintainTables($_randStandard,$_timeouts)
{
    global $CONFIG,$INTERNAL;
    if($_randStandard == 1)
    {
        if(!STATS_ACTIVE)
        {
            queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `last_active`<".DBManager::RealEscape(time()-($CONFIG["gl_dvhd"]*86400)).";");
            queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_OPERATOR_STATUS."` WHERE `".DB_PREFIX.DATABASE_OPERATOR_STATUS."`.`confirmed`<".DBManager::RealEscape(time()-($CONFIG["gl_dvhd"]*86400)).";");
        }
        else
            StatisticProvider::DeleteHTMLReports();

        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id` = `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."`.`receiver_user_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE (`html` = '0' OR `html` = '') AND `time` < " . DBManager::RealEscape(time()-$_timeouts[3]));
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `closed`='".time()."' WHERE `chat_type`<>1 AND `closed`<`endtime` AND `endtime`<".(time()-1800).";");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `closed`=0 AND `chat_type`=1 AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id` = `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`.`chat_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `time` < " . DBManager::RealEscape(time()-$_timeouts[3]));
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `persistent` = '0' AND `time` < " . DBManager::RealEscape(time()-$_timeouts[1]));
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `repost` = '1' AND `time` < " . DBManager::RealEscape(time()-$_timeouts[0]));
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` WHERE `time` < ".DBManager::RealEscape(time()-$_timeouts[1]));
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."` WHERE `created` < " . DBManager::RealEscape(time()-$_timeouts[0]));
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_PROFILE_PICTURES."` WHERE `webcam`=1 AND `time` < ".DBManager::RealEscape(time()-$_timeouts[0]));
    }
    else if($_randStandard == 2)
    {
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_ALERTS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id` = `".DB_PREFIX.DATABASE_ALERTS."`.`receiver_user_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_FILES."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id` = `".DB_PREFIX.DATABASE_CHAT_FILES."`.`visitor_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id` = `".DB_PREFIX.DATABASE_CHAT_FORWARDS."`.`chat_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `id` = `".DB_PREFIX.DATABASE_CHAT_REQUESTS."`.`receiver_browser_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_STATS_AGGS_GOALS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_GOALS."` WHERE `id` = `".DB_PREFIX.DATABASE_STATS_AGGS_GOALS."`.`goal`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` WHERE `id` = `".DB_PREFIX.DATABASE_STATS_AGGS_PAGES."`.`url`)");
        queryDB(true,"DELETE `".DB_PREFIX.DATABASE_TICKETS."` FROM `".DB_PREFIX.DATABASE_TICKETS."` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`ticket_id` WHERE `deleted`=1 AND `time` < " . DBManager::RealEscape(time()-$_timeouts[3]) .";");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `id` = `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."`.`ticket_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_EDITORS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `id` = `".DB_PREFIX.DATABASE_TICKET_EDITORS."`.`ticket_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_LOGS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `id` = `".DB_PREFIX.DATABASE_TICKET_LOGS."`.`ticket_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `id` = `".DB_PREFIX.DATABASE_TICKET_COMMENTS."`.`ticket_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `id` = `".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`ticket_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `ticket_id` = `".DB_PREFIX.DATABASE_TICKETS."`.`id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `id` = `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."`.`parent_id`) AND NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `email_id` = `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."`.`parent_id`)");
    }
    else if($_randStandard == 3)
    {
        if(empty($CONFIG["gl_vmac"]))
            queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `last_active`<".(time()-$CONFIG["timeout_track"]) . " LIMIT 250;");

        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `visit_id` = `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."`.`visit_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `id` = `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`.`browser_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id` = `".DB_PREFIX.DATABASE_VISITOR_CHATS."`.`visitor_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id` = `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."`.`chat_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_GOALS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id` = `".DB_PREFIX.DATABASE_VISITOR_GOALS."`.`visitor_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `id` = `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."`.`receiver_browser_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_OVERLAY_BOXES."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `id` = `".DB_PREFIX.DATABASE_OVERLAY_BOXES."`.`receiver_browser_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_GROUPS."` WHERE `id` = `".DB_PREFIX.DATABASE_GROUP_MEMBERS."`.`group_id`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_LOCALIZATIONS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` WHERE `id` = `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_LOCALIZATIONS."`.`tid`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` WHERE NOT EXISTS (SELECT * FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` WHERE `id` = `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."`.`tid`)");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `deleted`=1 AND `edited` < " . DBManager::RealEscape(time()-$_timeouts[3]));
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_COMMENTS."` WHERE `created` < " . DBManager::RealEscape(time()-(max(1,$CONFIG["gl_colt"])*86400)));
    }
    else if($_randStandard == 4)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_RESOURCES."` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE NOT EXISTS(SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` WHERE `res_id` = `".DB_PREFIX.DATABASE_RESOURCES."`.`id`) AND `type`=3 AND `parentid`=100 LIMIT 10;");

        if($CONFIG["gl_adct"] != 1)
        {
            if(!empty($CONFIG["gl_rm_chats"]))
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=1 AND `time` < " . intval(time()-$CONFIG["gl_rm_chats_time"]));

            if(!empty($CONFIG["gl_rm_oc"]))
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=0 AND `time` < " . intval(time()-$CONFIG["gl_rm_oc_time"]));

            if(!empty($CONFIG["gl_rm_gc"]))
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=2 AND `time` < " . intval(time()-$CONFIG["gl_rm_gc_time"]));

            if(!empty($CONFIG["gl_rm_rt"]))
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_RATINGS."` WHERE `time` < " . intval(time()-$CONFIG["gl_rm_rt_time"]));

            if(!empty($CONFIG["gl_rm_cf"]))
            {
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_RESOURCES."` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=4 AND `created` < " . intval(time()-$CONFIG["gl_rm_cf_time"]) . " ORDER BY `created` ASC LIMIT 5;");
                if(!empty($INTERNAL))
                    foreach($INTERNAL as $sid => $operator)
                        if(!$operator->IsBot)
                            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_RESOURCES."` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=3 AND `parentid`='".DBManager::RealEscape($sid)."' AND `created` < " . intval(time()-$CONFIG["gl_rm_cf_time"]) . " ORDER BY `created` ASC LIMIT 5;");
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_RESOURCES."` SET `discarded`=1,`edited`=UNIX_TIMESTAMP() WHERE `discarded`=0 AND `type`=0 AND `parentid`=5 AND `created` < " . intval(time()-$CONFIG["gl_rm_cf_time"]) . " ORDER BY `created` ASC LIMIT 5;");
            }

            if(!empty($CONFIG["gl_rm_om"]))
                queryDB(true,"DELETE `".DB_PREFIX.DATABASE_TICKETS."` FROM `".DB_PREFIX.DATABASE_TICKETS."` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`ticket_id` WHERE `".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`time` < " . DBManager::RealEscape(time()-$CONFIG["gl_rm_om_time"]));

            if(!empty($CONFIG["gl_rm_tid"]))
                queryDB(true,"DELETE `".DB_PREFIX.DATABASE_TICKETS."` FROM `".DB_PREFIX.DATABASE_TICKETS."` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`ticket_id` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_EDITORS."`.`ticket_id` WHERE `".DB_PREFIX.DATABASE_TICKET_EDITORS."`.`status`=3 AND `".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`time` < " . DBManager::RealEscape(time()-$CONFIG["gl_rm_tid_time"]));

            if(!empty($INTERNAL) && !empty($CONFIG["gl_rm_bc"]))
                foreach($INTERNAL as $sid => $operator)
                    if($operator->IsBot)
                        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=1 AND `internal_id`='".DBManager::RealEscape($sid)."' AND `time` < " . DBManager::RealEscape(time()-$CONFIG["gl_rm_bc_time"]));
        }

        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `discarded`=1 AND `type` > 2"))
            while($result && $row = DBManager::FetchArray($result))
            {
                $resultb = queryDB(true,"SELECT count(value) as `linked` FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `value`='". DBManager::RealEscape($row["value"])."';");
                $rowb = DBManager::FetchArray($resultb);
                if($rowb["linked"] == 1)
                    @unlink(PATH_UPLOADS . $row["value"]);
            }

        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `discarded`='1' AND `edited` < " . DBManager::RealEscape(time()-$_timeouts[3]));
    }
}
?>