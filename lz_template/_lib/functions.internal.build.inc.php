<?php
/****************************************************************************************
* LiveZilla intern.build.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

function buildFilters()
{
	global $FILTERS,$RESPONSE;
	$RESPONSE->Filter = "";
	foreach($FILTERS->Filters as $filter)
	{
		if($filter->Expiredate != -1 && ($filter->Expiredate + $filter->Created) < time())
			$filter->Destroy();
		else if($filter->Filtername != OO_TRACKING_FILTER_NAME)
			$RESPONSE->Filter .= $filter->GetXML();
	}
}

function buildEvents()
{
	global $EVENTS,$RESPONSE,$DUT;
    initData(array("EVENTS"));
    if(!isDataUpdate(POST_INTERN_DUT_EVENTS,DATA_UPDATE_KEY_EVENTS))
    {
        $RESPONSE->Events = "<ev dut=\"".base64_encode($DUT[DATA_UPDATE_KEY_EVENTS])."\" nu=\"".base64_encode(1)."\" />";
        return;
    }
	$RESPONSE->Events = "";
	if(!empty($EVENTS))
    {
		foreach($EVENTS->Events as $event)
			$RESPONSE->Events .= $event->GetXML();
        $RESPONSE->Events = "<ev dut=\"".base64_encode($DUT[DATA_UPDATE_KEY_EVENTS])."\">\r\n" . $RESPONSE->Events . "</ev>";
    }
}

function buildActions()
{
	global $RESPONSE,$EVENTS;
	$RESPONSE->Actions = "";
    if(count($EVENTS->Events)>0)
    {
        if($result = queryDB(true,"SELECT `trigger_id`,`action_id` FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."` INNER JOIN `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` ON `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`trigger_id`=`".DB_PREFIX.DATABASE_EVENT_TRIGGERS."`.`id` WHERE `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`receiver_user_id` = '".DBManager::RealEscape(CALLER_SYSTEM_ID)."' GROUP BY `action_id` ORDER BY `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`created` ASC"))
            while($row = DBManager::FetchArray($result))
            {
                $internalaction = new EventActionInternal($row);
                $RESPONSE->Actions .= $internalaction->GetXML();
            }
	    queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."` WHERE `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`receiver_user_id` = '".DBManager::RealEscape(CALLER_SYSTEM_ID)."';");
    }
}

function buildGoals()
{
	global $RESPONSE,$INTERNAL;
	$RESPONSE->Goals = "";

    if($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_REPORTS) == PERMISSION_NONE)
        return;

	if(STATS_ACTIVE)
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_GOALS."` ORDER BY `ind` ASC"))
			while($row = DBManager::FetchArray($result))
			{
				$goal = new Goal($row);
				$RESPONSE->Goals .= $goal->GetXML();
			}
}

function buildChatVouchers($typecond="")
{
	global $RESPONSE,$INTERNAL,$GROUPS,$CONFIG;
    if(empty($_POST["p_ct_r"]))
        return;
    if($_POST["p_ct_r"] == XML_CLIP_NULL)
		$_POST["p_ct_r"] = 0;
    $RESPONSE->ChatVouchers = "";
    if(!empty($CONFIG["db"]["cct"]))
    {
        $types = array();
        foreach($INTERNAL[CALLER_SYSTEM_ID]->Groups as $gid)
            if(isset($GROUPS[$gid]) && is_array($GROUPS[$gid]->ChatVouchersRequired))
                foreach($GROUPS[$gid]->ChatVouchersRequired as $vid)
                {
                    if(!isset($types[$vid]))
                    {
                        $types[$vid] = $vid;
                        if(!empty($typecond))
                            $typecond .= " OR ";
                        $typecond .= "`t1`.`tid`='" . $vid . "'";
                    }
                }

        if(!empty($typecond) && is_numeric($_POST["p_ct_r"]))
            if($result = queryDB(true,$d = "SELECT *,`t1`.`id` AS `voucherid` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`edited` > ".$_POST["p_ct_r"]." AND (" . $typecond . ") ORDER BY `t1`.`edited` ASC LIMIT " . DATA_ITEM_LOADS . ";"))
                while($row = DBManager::FetchArray($result))
                {
                    $voucher = new CommercialChatVoucher($row);
                    $RESPONSE->ChatVouchers .= $voucher->GetXML();
                }
    }
}

function buildReports($xml="")
{
	global $RESPONSE,$STATS,$INTERNAL;
    if(empty($_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME]))
        return;
	if(empty($STATS->CurrentDay) || $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_REPORTS) == PERMISSION_NONE)
		return;
	if($_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME] == XML_CLIP_NULL)
		$_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME] = "0_0";
	$parts = explode("_",$_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME]);

	if($result = queryDB(true,"SELECT *,(SELECT MAX(`time`) FROM `".DB_PREFIX.DATABASE_STATS_AGGS."`) AS `maxtime`,(SELECT MAX(`mtime`) FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE `maxtime`=`time`) AS `maxmtime` FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE (`time` = ".DBManager::RealEscape($parts[0])." AND `mtime` > ".DBManager::RealEscape($parts[1]).") OR (`time` > ".DBManager::RealEscape($parts[0]).") ORDER BY `time` ASC,`mtime` ASC LIMIT 1"))
	{
		while($row = DBManager::FetchArray($result))
		{
			if($row["month"]==0)
				$report = new StatisticYear($row["year"],0,0,$row["aggregated"],$row["mtime"]);
			else if($row["day"]==0)
				$report = new StatisticMonth($row["year"],$row["month"],0,$row["aggregated"],$row["mtime"]);
			else
				$report = new StatisticDay($row["year"],$row["month"],$row["day"],$row["aggregated"],$row["mtime"]);
				
			$type = -1;
			$update = false;
			$value = "";
			
			if($report->Type == STATISTIC_PERIOD_TYPE_DAY)
			{
				if($_POST[POST_INTERN_PROCESS_UPDATE_REPORT_TYPE]==1)
				{
					if($STATS->CurrentDay->CreateVisitorList)
					{
						if(empty($row["aggregated"]) && (!@file_exists($report->GetFilename(true,true)) || ($row["time"] < (time()-StatisticProvider::$AutoUpdateTime))))
							$report->SaveVisitorListToFile();
						if(@file_exists($report->GetFilename(true,true)))
							$value = getFile($report->GetFilename(true,true));
					}
					$type = 1;
				}
				else if($_POST[POST_INTERN_PROCESS_UPDATE_REPORT_TYPE]==0)
				{
					if($STATS->CurrentDay->CreateReport)
					{
						if(empty($row["aggregated"]) && (!@file_exists($report->GetFilename(true,false)) || ($row["time"] < (time()-StatisticProvider::$AutoUpdateTime))))
						{
							$update = true;
							$report->SaveReportToFile();
						}
						else if(@file_exists($report->GetFilename(true,false)))
							$value = getFile($report->GetFilename(true,false));
					}
					$type = 0;
				}
			}
			else
			{
				if(empty($row["aggregated"]) && (!@file_exists($report->GetFilename(true,false)) || ($row["time"] < (time()-StatisticProvider::$AutoUpdateTime))))
					$report->SaveReportToFile();
				if(@file_exists($report->GetFilename(true,false)))
					$value = getFile($report->GetFilename(true,false));
				$type = ($report->Type == STATISTIC_PERIOD_TYPE_MONTH) ? 2 : 3;
			}
			if($type > -1)
			{
				$convrate = ($row["sessions"]>0) ? round(((100*$row["conversions"])/$row["sessions"]),StatisticProvider::$RoundPrecision) : 0;
				$chats = $chatsd = 0;
				
				$qmonth = ($report->Type == STATISTIC_PERIOD_TYPE_YEAR) ? "" : " AND `month`='".DBManager::RealEscape($row["month"])."'";
				$qday = ($report->Type != STATISTIC_PERIOD_TYPE_DAY) ? "" : " AND `day`='".DBManager::RealEscape($row["day"])."'";
				
				if($results = queryDB(true,"SELECT (SUM(`amount`)-SUM(`multi`)) AS `samount` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_CHATS."` WHERE `year`='".DBManager::RealEscape($row["year"])."'".$qmonth.$qday.""))
					if(DBManager::GetRowCount($results) == 1)
					{
						$rows = DBManager::FetchArray($results);
						if(is_numeric($rows["samount"]))
							$chats = $rows["samount"];
					}

                languageSelect("",true);
                $value = applyReplacements($value,true,false,false,true);
				$xml .= "<r cid=\"".base64_encode(getId(3))."\" ragg=\"".base64_encode(empty($row["aggregated"]) ? 0 : 1)."\" rtype=\"".base64_encode($type)."\" convrate=\"".base64_encode($convrate)."\" chats=\"".base64_encode($chats)."\" update=\"".base64_encode(($update)?1:0)."\" visitors=\"".base64_encode($row["sessions"])."\" time=\"".base64_encode($row["time"])."\" mtime=\"".base64_encode($row["mtime"])."\" year=\"".base64_encode($row["year"])."\" month=\"".base64_encode($row["month"])."\" day=\"".base64_encode($row["day"])."\">".base64_encode($value)."</r>\r\n";
			}
			$xml .= "<ri maxtime=\"".base64_encode($row["maxtime"])."\" maxmtime=\"".base64_encode($row["maxmtime"])."\" />";
		}
	}
	$RESPONSE->SetStandardResponse(1,$xml);
}

function buildResources($xml="",$count=0,$last=0)
{
	global $RESPONSE,$INTERNAL;
	
	if($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_RESOURCES) == PERMISSION_NONE)
		return;
	
	$resources = array();
	if($_POST[POST_INTERN_XMLCLIP_RESSOURCES_END_TIME] == XML_CLIP_NULL)
		$_POST[POST_INTERN_XMLCLIP_RESSOURCES_END_TIME] = 0;

	if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `edited` > ".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_RESSOURCES_END_TIME])." AND `edited`<".DBManager::RealEscape(time())." AND parentid<>100 ORDER BY `edited` ASC"))
	{
		while($row = DBManager::FetchArray($result))
			$resources[] = $row;
	}
	
	foreach($resources as $res)
	{
		if(++$count <= DATA_ITEM_LOADS || $res["edited"] == $last)
			$xml .= "<r rid=\"".base64_encode($res["id"])."\" si=\"".base64_encode($res["size"])."\" di=\"".base64_encode($res["discarded"])."\" oid=\"".base64_encode($res["owner"])."\" eid=\"".base64_encode($res["editor"])."\" ty=\"".base64_encode($res["type"])."\" ti=\"".base64_encode($res["title"])."\" t=\"".base64_encode($res["tags"])."\" ed=\"".base64_encode($last = $res["edited"])."\" pid=\"".base64_encode($res["parentid"])."\" ra=\"".base64_encode($res["rank"])."\">".base64_encode($res["value"])."</r>\r\n";
		else
			break;
	}
	$RESPONSE->Resources = (strlen($xml) > 0) ? $xml : null;
}

function buildArchive($count=0,$last=0,$limit=0,$xml="")
{
	global $RESPONSE;
	initData(array("INPUTS"));
	if(isset($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME]))
    {
        $_POST["DAUT"] = strval($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME]+1) . "000";
        if(!isDataUpdate("DAUT",DATA_UPDATE_KEY_CHATS))
            return;

		$chats = array();
		if($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME] == XML_CLIP_NULL)
			$_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME] = 0;
		
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `html`!='0' AND `closed` > ".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME])." AND `closed` < ".DBManager::RealEscape(time())." AND `internal_id` !='0' ORDER BY `closed` ASC LIMIT " . (DATA_ITEM_LOADS*2)))
			while($row = DBManager::FetchArray($result))
            {
				$chats[$row["chat_id"]] = new Chat();
                $chats[$row["chat_id"]]->SetValues($row);
            }
	
	    $xml = "";
	    if($result = queryDB(true,"SELECT count(*) as `total` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `html`!='0' AND `closed` > ".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME])." AND `closed` < ".DBManager::RealEscape(time())." AND `internal_id` !='0' ORDER BY `closed` ASC"))
	        if($row = DBManager::FetchArray($result))
	            if(!empty($row["total"]))
	                $limit = $row["total"];

		foreach($chats as $chat)
		{
			if(++$count <= DATA_ITEM_LOADS || $chat->Closed == $last)
			{
				$xml .= $chat->GetXML($chat->Permission(CALLER_SYSTEM_ID));
			}
			else
				break;
		}
        if($limit > 0 || $count > 0)
	        $xml = "<l l=\"".base64_encode($limit)."\">".base64_encode($count)."</l>\r\n" . $xml;
	}
	$RESPONSE->Archive = (strlen($xml) > 0) ? $xml : null;
}

function buildRatings($xml="")
{
	global $RESPONSE,$INTERNAL;

    if(empty($_POST[POST_INTERN_XMLCLIP_RATING_END_TIME]))
        return;

	$permission = $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_RATINGS);
	if($_POST[POST_INTERN_XMLCLIP_RATING_END_TIME] == XML_CLIP_NULL)
		$_POST[POST_INTERN_XMLCLIP_RATING_END_TIME] = 0;

	$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_RATINGS."` WHERE time>".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_RATING_END_TIME])." ORDER BY `time` ASC LIMIT ".DBManager::RealEscape(DATA_ITEM_LOADS).";");
	if($result)
		while($row = DBManager::FetchArray($result))
		{
			$rating = new Rating($row["id"],$row);
			$xml .= $rating->GetXML($INTERNAL,(($rating->OperatorSystemId == $INTERNAL[CALLER_SYSTEM_ID]->UserId && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL));
		}
	queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_RATINGS."` WHERE time<".DBManager::RealEscape(DATA_LIFETIME).";");
	$RESPONSE->Ratings = $xml;
}

function demandReports()
{
    global $RESPONSE,$INTERNAL,$DUT;

    if(!STATS_ACTIVE || !isset($_POST["p_dr_p"]) || $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_REPORTS) == PERMISSION_NONE)
        return;

    if(!isDataUpdate(POST_INTERN_DUT_REPORTS,DATA_UPDATE_KEY_REPORTS))
        return;

    $limit = (!empty($_POST["p_dr_p"]) && is_numeric($_POST["p_dr_p"]) && $_POST["p_dr_p"]>1) ? ($_POST["p_dr_p"]-1)*DATA_DEMAND_LOADS : 0;
    $type = (!empty($_POST["p_dr_t"]) && in_array($_POST["p_dr_t"],array(STATISTIC_PERIOD_TYPE_DAY,STATISTIC_PERIOD_TYPE_MONTH,STATISTIC_PERIOD_TYPE_YEAR))) ? $_POST["p_dr_t"] : STATISTIC_PERIOD_TYPE_DAY;
    $xml = "";
    if($type == STATISTIC_PERIOD_TYPE_DAY)
        $type = "`day` > 0";
    else if($type == STATISTIC_PERIOD_TYPE_MONTH)
        $type = "`month` > 0 AND `day`=0";
    else if($type == STATISTIC_PERIOD_TYPE_YEAR)
        $type = "`year` > 0 AND `day`=0 AND `month`=0";

    $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE ".$type." ORDER BY `time` DESC,`mtime` DESC LIMIT ".$limit.",".DBManager::RealEscape(DATA_DEMAND_LOADS).";");
    if($result)
    {
        while($row = DBManager::FetchArray($result))
        {
            if($row["month"]== 0 && $row["day"]==0)
                $report = new StatisticYear($row["year"],0,0,$row["aggregated"],$row["mtime"]);
            else if($row["day"]==0)
                $report = new StatisticMonth($row["year"],$row["month"],0,$row["aggregated"],$row["mtime"]);
            else
                $report = new StatisticDay($row["year"],$row["month"],$row["day"],$row["aggregated"],$row["mtime"]);

            $chats = 0;
            $qmonth = ($report->Type == STATISTIC_PERIOD_TYPE_YEAR) ? "" : " AND `month`='".DBManager::RealEscape($row["month"])."'";
            $qday = ($report->Type != STATISTIC_PERIOD_TYPE_DAY) ? "" : " AND `day`='".DBManager::RealEscape($row["day"])."'";
            if($results = queryDB(true,"SELECT (SUM(`amount`)-SUM(`multi`)) AS `samount` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_CHATS."` WHERE `year`='".DBManager::RealEscape($row["year"])."'".$qmonth.$qday.""))
                if(DBManager::GetRowCount($results) == 1)
                {
                    $rows = DBManager::FetchArray($results);
                    if(is_numeric($rows["samount"]))
                        $chats = $rows["samount"];
                }
            $convrate = ($row["sessions"]>0) ? round(((100*$row["conversions"])/$row["sessions"]),StatisticProvider::$RoundPrecision) : 0;
            $xml .= "<r i=\"".base64_encode($report->GetHash())."\" a=\"".base64_encode($row["aggregated"])."\" ch=\"".base64_encode($chats)."\" c=\"".base64_encode($convrate)."\" r=\"".base64_encode($report->Type)."\" s=\"".base64_encode($row["sessions"])."\" v=\"".base64_encode($row["visitors_unique"])."\" t=\"".base64_encode($row["time"])."\" mt=\"".base64_encode($row["mtime"])."\" y=\"".base64_encode($row["year"])."\" m=\"".base64_encode($row["month"])."\" d=\"".base64_encode($row["day"])."\"></r>\r\n";
        }
    }
    $result = queryDB(true,"SELECT count(`time`) AS `total` FROM `".DB_PREFIX.DATABASE_STATS_AGGS."`;");
    $trow = DBManager::FetchArray($result);
    $result = queryDB(true,"SELECT count(`time`) AS `ttotal` FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE ".$type.";");
    $ttrow = DBManager::FetchArray($result);
    $RESPONSE->Reports = "<dr dut=\"".base64_encode($DUT[DATA_UPDATE_KEY_REPORTS])."\" p=\"".base64_encode(DATA_ITEM_LOADS)."\" t=\"".base64_encode($trow["total"])."\" q=\"".base64_encode($ttrow["ttotal"])."\">\r\n" . $xml . "\r\n</dr>";
}

function demandEmails($xml="",$count=0,$lmc=0,$c_name="",$c_text="")
{
    global $RESPONSE,$INTERNAL,$DUT;

    if(!isDataUpdate(POST_INTERN_DUT_EMAILS,DATA_UPDATE_KEY_EMAILS))
        return;

    $result = queryDB(true,"SELECT `t1`.`email_id`,`t1`.`group_id` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_MAILBOXES."` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `t1`.`deleted`=0;");
    if($result)
    {
        $permission = $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_MESSAGES);
        $permissione = $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(22);

        while($row = DBManager::FetchArray($result))
        {
            $full = $permissione != PERMISSION_NONE && ((in_array($row["group_id"],$INTERNAL[CALLER_SYSTEM_ID]->Groups) && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL);
            if($full)
                $count++;
        }
    }
    if($count>0)
    {
        if(!empty($_POST["p_de_a"]) && is_numeric($_POST["p_de_a"]))
        {
            $result = queryDB(true,"SELECT `t1`.*,`t2`.`email` AS `receiver_mail` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_MAILBOXES."` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `t1`.`deleted`=0 ORDER BY `edited` ASC" . " LIMIT 0,".$_POST["p_de_a"].";");
            if($result)
                while($row = DBManager::FetchArray($result))
                {
                    $full = $permissione != PERMISSION_NONE && ((in_array($row["group_id"],$INTERNAL[CALLER_SYSTEM_ID]->Groups) && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL);
                    $email = new TicketEmail($row);
                    $email->LoadAttachments();
                    $xml .= $email->GetXML($full);
                }
        }
        $result = queryDB(true,"SELECT `created` AS `lmc`,sender_name,sender_email,body FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `group_id` IN ('".implode("','",$INTERNAL[CALLER_SYSTEM_ID]->Groups)."') ORDER BY `created` DESC LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {
            $lmc = $row["lmc"];
            $c_name = cutString((!empty($row["sender_name"]) ? $row["sender_name"] : $row["sender_email"]),90);
            $c_text = cutString($row["body"],90);
        }
    }
    $RESPONSE->Messages .= "<de dut=\"".base64_encode($DUT[DATA_UPDATE_KEY_EMAILS])."\" lmc=\"".base64_encode($lmc)."\" lmn=\"".base64_encode($c_name)."\" lmt=\"".base64_encode($c_text)."\" c=\"".base64_encode($count)."\">\r\n" . $xml . "\r\n</de>";
}

function demandChats($xml="",$q_filter="",$q_searchw="")
{
    global $RESPONSE,$DUT;
    if(!isDataUpdate(POST_INTERN_DUT_CHATS,DATA_UPDATE_KEY_CHATS))
        return;

    $loads = (!empty($_POST["p_dc_l"]) && is_numeric($_POST["p_dc_l"])) ? $_POST["p_dc_l"] : DATA_DEMAND_LOADS;
    $limit = (!empty($_POST["p_dc_p"]) && is_numeric($_POST["p_dc_p"]) && $_POST["p_dc_p"]>1) ? ($_POST["p_dc_p"]-1)*$loads : 0;

    if(!empty($_POST["p_dc_fg"]))
        $q_filter = "`chat_type`=2 AND `group_id`='" . DBManager::RealEscape($_POST["p_dc_fg"]) . "'";
    else if(!empty($_POST["p_dc_fe"]))
        $q_filter = "`chat_type`=1 AND `external_id`='" . DBManager::RealEscape($_POST["p_dc_fe"]) . "'";
    else if(!empty($_POST["p_dc_fi"]))
        $q_filter = "`chat_type`=0 AND `internal_id`='" . DBManager::RealEscape($_POST["p_dc_fi"]) . "'";
    else
    {
        if(!isset($_POST["p_dc_f"]))
            $_POST["p_dc_f"] = "012";

        $fchars=str_split($_POST["p_dc_f"]);
        foreach($fchars as $fchar)
            if(is_numeric($fchar))
                if(!empty($fchar))
                    $q_filter.= (empty($q_filter)) ? "`chat_type`=".$fchar : " OR `chat_type`=".$fchar;
                else
                    $q_filter.= (empty($q_filter)) ? "`chat_type`=0" : " OR `chat_type`=0";

        if(!empty($_POST["p_dc_q"]))
        {
            $q = DBManager::RealEscape(strtolower($_POST["p_dc_q"]));
            $q_searchw = "LOWER(`fullname`) LIKE '%".$q."%' OR LOWER(`area_code`) LIKE '%".$q."%' OR LOWER(`html`) LIKE '%".$q."%'  OR LOWER(`plaintext`) LIKE '%".$q."%' OR LOWER(`transcript_text`) LIKE '%".$q."%' OR LOWER(`email`) LIKE '%".$q."%' OR LOWER(`company`) LIKE '%".$q."%' OR LOWER(`phone`) LIKE '%".$q."%' OR LOWER(`chat_id`) LIKE '%".$q."%' OR LOWER(`external_id`) LIKE '%".$q."%' OR LOWER(`question`) LIKE '%".$q."%'";
            $q_searchw = " AND (" . $q_searchw . ")";
        }
    }

    initData(array("INPUTS"));

    $q_base = "`closed`>0 AND `html`!='0'";
    $q_grperm = Chat::GetPermissionSQL(CALLER_SYSTEM_ID);

    if(!empty($q_filter))
        $q_filter = " AND (" . $q_filter . ")";

    $q_inner = "FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE ". $q_base . $q_filter . $q_searchw . $q_grperm ." ORDER BY `closed` DESC";

    $result = queryDB(true,"SELECT * " . $q_inner . " LIMIT ".$limit.",".DBManager::RealEscape($loads).";");
    if($result)
        while($row = DBManager::FetchArray($result))
        {
            $chat = new Chat();
            $chat->SetValues($row);
            $xml .= $chat->GetXML($chat->Permission(CALLER_SYSTEM_ID),true,false);
        }

    $q_count["total"] = "SELECT COUNT(*) AS `total`";
    $q_count["totalperm"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`.`chat_id` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE ". $q_base . $q_grperm .") AS `sta`) AS `totalperm`";
    $q_count["totalquery"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`.`chat_id` ". $q_inner .") AS `stb`) AS `totalquery`";

    $result = queryDB(true,$q_count["total"].",".$q_count["totalperm"].",".$q_count["totalquery"]." FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`");
    $row = DBManager::FetchArray($result);
    $c_total = min($row["total"],$row["totalperm"]);
    $c_totalquery = min($row["totalquery"],$row["totalperm"]);
    $RESPONSE->Archive .= "<dc dut=\"".base64_encode($DUT[DATA_UPDATE_KEY_CHATS])."\" p=\"".base64_encode($loads)."\" t=\"".base64_encode($c_total)."\" q=\"".base64_encode($c_totalquery)."\">\r\n" . $xml . "\r\n</dc>";
}

function demandTickets($xml="",$q_filter="",$q_searchw="",$q_searchf="",$c_total=0,$c_totalread=0,$c_totalquery=0,$c_lmc=0,$c_name="",$c_text="")
{
    global $RESPONSE,$INTERNAL,$DUT;
    $permission = $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_MESSAGES);
    if($permission != PERMISSION_NONE)
    {
        if(!isDataUpdate(POST_INTERN_DUT_TICKETS,DATA_UPDATE_KEY_TICKETS))
            return;

        if(!empty($_POST["p_dt_q"]))
            unset($_POST["p_dt_f"],$_POST["p_dt_fc"],$_POST["p_dt_fp"],$_POST["p_dt_fg"]);

        if(!isset($_POST["p_dt_f"]))
            $_POST["p_dt_f"] = "0123";
        else if($_POST["p_dt_f"]=="")
            $_POST["p_dt_f"] = "9";

        if(!isset($_POST["p_dt_fc"]))
            $_POST["p_dt_fc"] = "01234567";
        else if($_POST["p_dt_fc"]=="")
            $_POST["p_dt_fc"] = "9";

        $loads = (!empty($_POST["p_dt_l"]) && is_numeric($_POST["p_dt_l"])) ? $_POST["p_dt_l"] : DATA_DEMAND_LOADS;
        $limit = (!empty($_POST["p_dt_p"]) && is_numeric($_POST["p_dt_p"]) && $_POST["p_dt_p"]>1) ? ($_POST["p_dt_p"]-1)*$loads : 0;

        $q_sort = array();
        $q_sort["id"] = " AND `deleted`=0 GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` DESC";
        $q_sort["update"] = " AND `deleted`=0 GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`last_update` DESC";
        $q_sort["wait"] = " AND `deleted`=0 GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`wait_begin` ASC";
        $sort_index = (!empty($_POST["p_dt_s"]) && !empty($q_sort[$_POST["p_dt_s"]])) ? $_POST["p_dt_s"] : "id";

        if(!(!empty($_POST["p_dt_mr"]) && is_numeric($_POST["p_dt_mr"])))
            $max_last_update_read = time()-(14*86400);
        else
            $max_last_update_read = $_POST["p_dt_mr"];

        $fchars=str_split($_POST["p_dt_f"]);
        foreach($fchars as $fchar)
            if(is_numeric($fchar))
                if(!empty($fchar))
                    $q_filter.= (empty($q_filter)) ? "`status`=".$fchar : " OR `status`=".$fchar;
                else
                    $q_filter.= (empty($q_filter)) ? "`status` IS NULL OR `status`=0" : " OR `status` IS NULL OR `status`=0";


        $fchars=str_split($_POST["p_dt_fc"]);
        $q_filter_channel = "";
        foreach($fchars as $fchar)
            if(is_numeric($fchar))
                if(!empty($fchar))
                    $q_filter_channel .= (empty($q_filter_channel)) ? "`creation_type`=".$fchar : " OR `creation_type`=".$fchar;
                else
                    $q_filter_channel.= (empty($q_filter_channel)) ? "`creation_type` IS NULL OR `creation_type`=0" : " OR `creation_type` IS NULL OR `creation_type`=0";
        $q_filter = (empty($q_filter)) ? $q_filter_channel : "(" . $q_filter . ") AND ( " . $q_filter_channel . ")";

        if(!empty($_POST["p_dt_fp"]))
        {
            if(empty($q_filter))
                $q_filter.= "`editor_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'";
            else
                $q_filter = "(" . $q_filter . ") AND `editor_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'";
        }

        if(!empty($_POST["p_dt_fg"]) && $permission == PERMISSION_FULL)
        {
            if(empty($q_filter))
                $q_filter.= "`target_group_id` IN ('".implode("','",$INTERNAL[CALLER_SYSTEM_ID]->Groups)."')";
            else
                $q_filter = "(" . $q_filter . ") AND `target_group_id` IN ('".implode("','",$INTERNAL[CALLER_SYSTEM_ID]->Groups)."')";
        }

        if(!empty($_POST["p_dt_q"]))
        {
            $q = DBManager::RealEscape(strtolower($_POST["p_dt_q"]));
            $q_searchf = " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` AS `tc` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tc`.`ticket_id`";
            $q_searchf .= " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` AS `tm` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tm`.`ticket_id` ";
            $q_searchw = "`tm`.`sender_id` LIKE '%".$q."%' OR `tm`.`ticket_id` LIKE '%".$q."%' OR LOWER(`tc`.`value`) LIKE '%".$q."%' OR LOWER(`tm`.`text`) LIKE '%".$q."%' OR LOWER(`tm`.`fullname`) LIKE '%".$q."%'  OR LOWER(`tm`.`email`) LIKE '%".$q."%' OR LOWER(`tm`.`company`) LIKE '%".$q."%' OR LOWER(`tm`.`phone`) LIKE '%".$q."%' OR LOWER(`tm`.`subject`) LIKE '%".$q."%'";
            $q_searchw = " AND (" . $q_searchw . ")";
        }

        initData(array("INPUTS"));
        $q_grperm = ($permission == PERMISSION_FULL) ? "" : "`target_group_id` IN ('".implode("','",$INTERNAL[CALLER_SYSTEM_ID]->Groups)."') AND ";
        $q_inner = "FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_EDITORS."`.`ticket_id` ". $q_searchf ."WHERE ". $q_grperm ."`deleted`=0 AND (" . $q_filter . ")" . $q_searchw . $q_sort[$sort_index];
        $result = queryDB(true,"SELECT * " . $q_inner . " LIMIT ".$limit.",".DBManager::RealEscape($loads).";");

        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $ticket = new Ticket($row,null,null);
                if(count($ticket->Messages) > 0)
                    $xml .= $ticket->GetXML(true,true);
            }

        $q_grperm = ($permission == PERMISSION_FULL) ? "" : " WHERE `target_group_id` IN ('".implode("','",$INTERNAL[CALLER_SYSTEM_ID]->Groups)."')";

        $q_count["total"] = "SELECT COUNT(*) AS `total`";
        $q_count["totalperm"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_TICKETS."`.`id` FROM `".DB_PREFIX.DATABASE_TICKETS."`". $q_grperm .") AS `sta`) AS `totalperm`";
        $q_count["totalquery"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_TICKETS."`.`id` ". $q_inner .") AS `stb`) AS `totalquery`";
        $q_count["totalread"] = "(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `deleted`=0 AND `last_update`>".DBManager::RealEscape($max_last_update_read).") AS `totalread`";
        $result = queryDB(true,$q_count["total"].",".$q_count["totalperm"].",".$q_count["totalquery"].",".$q_count["totalread"]." FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `deleted`=0;");

        $row = DBManager::FetchArray($result);
        $c_total = min($row["total"],$row["totalperm"]);
        $c_totalread = min($row["totalread"],$row["totalperm"]);
        $c_totalquery = min($row["totalquery"],$row["totalperm"]);
        $q_grperm = ($permission == PERMISSION_FULL) ? "" : "`target_group_id` IN ('".implode("','",$INTERNAL[CALLER_SYSTEM_ID]->Groups)."') AND ";

        $result = queryDB(true,"SELECT `t2`.`created` AS `lmc`,`fullname`,`text` FROM `".DB_PREFIX.DATABASE_TICKETS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` AS `t2` ON `t1`.`id`=`t2`.`ticket_id` WHERE ".$q_grperm."(`t2`.`type`=0 OR `t2`.`type`=3) ORDER BY `t2`.`created` DESC LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {
            $c_lmc = $row["lmc"];
            $c_name = cutString($row["fullname"],90);
            $c_text = cutString($row["text"],90);
        }
    }
    $RESPONSE->Messages .= "<dt dut=\"".base64_encode($DUT[DATA_UPDATE_KEY_TICKETS])."\" lmc=\"".base64_encode($c_lmc)."\" lmn=\"".base64_encode($c_name)."\" lmt=\"".base64_encode($c_text)."\" p=\"".base64_encode($loads)."\" t=\"".base64_encode($c_total)."\" r=\"".base64_encode($c_totalread)."\" q=\"".base64_encode($c_totalquery)."\">\r\n" . $xml . "\r\n</dt>";
}

function buildTickets($xml="",$dle_xml="",$ticketCount=0,$itemCount=0)
{
	global $RESPONSE,$INTERNAL,$DUT;

    if(empty($_POST[POST_INTERN_XMLCLIP_TICKETS_END_TIME]))
        return;

    if(!isDataUpdate(POST_INTERN_DUT_TICKETS,DATA_UPDATE_KEY_TICKETS) && !isDataUpdate(POST_INTERN_DUT_EMAILS,DATA_UPDATE_KEY_EMAILS))
        return;

	initData(array("INPUTS"));

	$permission = $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_MESSAGES);

	if($_POST[POST_INTERN_XMLCLIP_TICKETS_END_TIME] == XML_CLIP_NULL || !is_numeric($_POST[POST_INTERN_XMLCLIP_TICKETS_END_TIME]))
		$_POST[POST_INTERN_XMLCLIP_TICKETS_END_TIME] = 0;

    if($_POST[POST_INTERN_XMLCLIP_TICKETS_STATUS_END_TIME] == XML_CLIP_NULL || !is_numeric($_POST[POST_INTERN_XMLCLIP_TICKETS_STATUS_END_TIME]))
        $_POST[POST_INTERN_XMLCLIP_TICKETS_STATUS_END_TIME] = 0;

    if($_POST[POST_INTERN_XMLCLIP_EMAILS_END_TIME] == XML_CLIP_NULL || !is_numeric($_POST[POST_INTERN_XMLCLIP_EMAILS_END_TIME]))
        $_POST[POST_INTERN_XMLCLIP_EMAILS_END_TIME] = 0;

    if($_POST[POST_INTERN_XMLCLIP_TICKETS_LOG_END_TIME] == XML_CLIP_NULL || !is_numeric($_POST[POST_INTERN_XMLCLIP_TICKETS_LOG_END_TIME]))
        $_POST[POST_INTERN_XMLCLIP_TICKETS_LOG_END_TIME] = 0;

    if($_POST[POST_INTERN_XMLCLIP_TICKETS_COMMENTS_END_TIME] == XML_CLIP_NULL || !is_numeric($_POST[POST_INTERN_XMLCLIP_TICKETS_COMMENTS_END_TIME]))
        $_POST[POST_INTERN_XMLCLIP_TICKETS_COMMENTS_END_TIME] = 0;

    $queries["messages"] = "FROM `".DB_PREFIX.DATABASE_TICKETS."` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`ticket_id` WHERE `time` >".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_TICKETS_END_TIME])." ORDER BY `time` ASC";
    $queries["mails"] = "FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_MAILBOXES."` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `edited` >".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_EMAILS_END_TIME])." ORDER BY `edited` ASC";
    $queries["status"] = "FROM `".DB_PREFIX.DATABASE_TICKETS."` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_EDITORS."`.`ticket_id` WHERE `time` >".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_TICKETS_STATUS_END_TIME])." ORDER BY `time` ASC;";
    $queries["log"] = "FROM `".DB_PREFIX.DATABASE_TICKET_LOGS."` WHERE `time` >".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_TICKETS_LOG_END_TIME])." ORDER BY `time` ASC;";
    $queries["comments"] = "FROM `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` WHERE `time` >".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_TICKETS_COMMENTS_END_TIME])." ORDER BY `time` ASC;";

	$result = queryDB(true,"SELECT * " . $queries["messages"]." LIMIT ".DBManager::RealEscape(DATA_ITEM_LOADS).";");
	if($result)
		while($row = DBManager::FetchArray($result))
		{
			$ticket = new Ticket($row);
			$full = ((in_array($ticket->Group,$INTERNAL[CALLER_SYSTEM_ID]->Groups) && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL);
            if($full)
			{
				$ticket->Messages[0]->LoadCustoms();
				$ticket->Messages[0]->LoadAttachments();
			}
			$xml .= $ticket->GetXML($full);
            $itemCount++;
            $ticketCount++;
		}

    if($ticketCount != DATA_ITEM_LOADS)
    {
        $mailcount = $last = 0;
        $result = queryDB(true,"SELECT `t1`.*,`t2`.`email` AS `receiver_mail` " . $queries["mails"] . " LIMIT ".DBManager::RealEscape(DATA_ITEM_LOADS*5).";");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $permissione = $INTERNAL[CALLER_SYSTEM_ID]->GetPermission(22);
                $full = $permissione != PERMISSION_NONE && ((in_array($row["group_id"],$INTERNAL[CALLER_SYSTEM_ID]->Groups) && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL);
                $email = new TicketEmail($row);
                $email->LoadAttachments();
                $xml .= $email->GetXML($full);
                $itemCount++;

                if($last != $row["edited"] && ++$mailcount >= DATA_ITEM_LOADS)
                    break;

                $last = $row["edited"];
		}

        $statuscount = $last = 0;
        $result = queryDB(true,"SELECT * " . $queries["status"]);
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                if($statuscount++ >= DATA_ITEM_LOADS && $last != $row["time"] && $last != 0)
                    break;

                $ticket = new TicketEditor($row["ticket_id"],$row);
                $xml .= $ticket->GetXML(@$row["wait_begin"],@$row["last_update"]);
                $itemCount++;
                $last = $row["time"];
            }

        $logcount = $last = 0;
        $result = queryDB(true,"SELECT * " . $queries["log"]);
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                if($logcount++ >= DATA_ITEM_LOADS && $last != $row["time"] && $last != 0)
                    break;

                $xml .= "<lo c=\"".base64_encode($row["created"])."\" ti=\"".base64_encode($row["time"])."\" t=\"".base64_encode($row["ticket_id"])."\" a=\"".base64_encode($row["action"])."\" o=\"".base64_encode($row["operator_id"])."\" v=\"".base64_encode($row["value_old"])."\">".base64_encode($row["value_new"])."</lo>\r\n";
                $last = $row["time"];
                $itemCount++;
            }

        $commentscount = $last = 0;
        $result = queryDB(true,"SELECT * " . $queries["comments"]);
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                if($commentscount++ >= DATA_ITEM_LOADS && $last != $row["time"] && $last != 0)
                    break;

                $xml .= "<c i=\"".base64_encode($row["id"])."\" c=\"".base64_encode($row["created"])."\" ti=\"".base64_encode($row["time"])."\" t=\"".base64_encode($row["ticket_id"])."\" m=\"".base64_encode($row["message_id"])."\" o=\"".base64_encode($row["operator_id"])."\">".base64_encode($row["comment"])."</c>\r\n";
                $last = $row["time"];
                $itemCount++;
            }
    }

    $count = 0;
    foreach($queries as $query)
        if($result = queryDB(true,"SELECT count(*) as `total` " . $query))
            while($row = DBManager::FetchArray($result))
                if(!empty($row["total"]))
                    $count += $row["total"];

    if(!empty($count))
    {
        $DUT[DATA_UPDATE_KEY_TICKETS] = 0;
        $xml = "<l l=\"".base64_encode($count)."\">".base64_encode($itemCount)."</l>\r\n" . $xml;
    }
    $RESPONSE->Messages = "<t dutt=\"".base64_encode($DUT[DATA_UPDATE_KEY_TICKETS])."\"  dute=\"".base64_encode($DUT[DATA_UPDATE_KEY_EMAILS])."\">\r\n" . $xml . $dle_xml . "</t>";
}

function buildNewPosts()
{
	global $INTERNAL,$RESPONSE;
	foreach($INTERNAL[CALLER_SYSTEM_ID]->GetPosts() as $post)
	{
		$RESPONSE->Posts .= $post->GetXml();
		$INTERNAL[CALLER_SYSTEM_ID]->SetRepostTime($post->ReceiverGroup,$post->Created);
	}
}

function buildIntern()
{
	global $INTERNAL,$GROUPS,$RESPONSE;
	$builder = new InternalXMLBuilder($INTERNAL[CALLER_SYSTEM_ID],$INTERNAL,$GROUPS);
	$builder->Generate();

	$RESPONSE->Internals = $builder->XMLInternal;
	$RESPONSE->Typing .= $builder->XMLTyping;
	$RESPONSE->InternalProfilePictures = $builder->XMLProfilePictures;
	$RESPONSE->InternalWebcamPictures = $builder->XMLWebcamPictures;
	$RESPONSE->Groups = $builder->XMLGroups;
	$RESPONSE->InternalVcards = $builder->XMLProfiles;
}

function buildExtern()
{
	global $VISITOR,$INTERNAL,$GROUPS,$RESPONSE;
	$RESPONSE->Tracking = "";

	$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE `auto`=0 AND `closed`=0 AND `received`=0 ORDER BY `created` ASC;");
	while($row = DBManager::FetchArray($result))
	{
		$forward = new Forward($row);
		$RESPONSE->Forwards .= $forward->GetXml();
		
		if(!empty($VISITOR[$forward->ReceiverUserId]) && $VISITOR[$forward->ReceiverUserId]->GetBrowser($forward->ReceiverBrowserId) != null)
		{
			if(!$forward->Invite)
				$VISITOR[$forward->ReceiverUserId]->GetBrowser($forward->ReceiverBrowserId)->Forward=$forward;
			else if(CALLER_SYSTEM_ID == $forward->TargetSessId)
				$forward->Save(true,true);
		}
	}
	
	$isex = !empty($INTERNAL[CALLER_SYSTEM_ID]->Groups) && $GROUPS[$INTERNAL[CALLER_SYSTEM_ID]->Groups[0]]->IsExternal;
	$builder = new ExternalXMLBuilder($INTERNAL[CALLER_SYSTEM_ID],$VISITOR,(NO_CLIPPING || isset($_POST[POST_INTERN_RESYNC])),$isex);
	$builder->SessionFileSizes = $INTERNAL[CALLER_SYSTEM_ID]->VisitorFileSizes;
	$builder->StaticReload = $INTERNAL[CALLER_SYSTEM_ID]->VisitorStaticReload;

	$base = array();
    $builder->SetDiscardedObject($base);
	$builder->Generate();
	$RESPONSE->Tracking = $builder->XMLCurrent;

	foreach($builder->DiscardedObjects as $uid => $list)
	{
		$RESPONSE->Tracking .= "<cd id=\"".base64_encode($uid)."\">\r\n";
		if($list != null)
			foreach($list as $bid)
				$RESPONSE->Tracking .= " <bd id=\"".base64_encode($bid)."\" />\r\n";
		$RESPONSE->Tracking .= "</cd>\r\n";
	}

	$RESPONSE->Typing .= $builder->XMLTyping;
	$INTERNAL[CALLER_SYSTEM_ID]->VisitorFileSizes = $builder->SessionFileSizes;
	$INTERNAL[CALLER_SYSTEM_ID]->VisitorStaticReload = $builder->StaticReload;

	if($builder->GetAll && !LOGIN)
		$RESPONSE->Tracking .= "<resync />\r\n";

	if(count($VISITOR) == 0)
		$INTERNAL[CALLER_SYSTEM_ID]->VisitorFileSizes = array();
}

?>
