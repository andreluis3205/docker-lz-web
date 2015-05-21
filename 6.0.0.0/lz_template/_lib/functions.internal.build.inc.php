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

function demandFilters()
{
	

    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_FILTERS,DATA_UPDATE_KEY_FILTERS))
        return;

    $xml = "";

	foreach(DataManager::$Filters->Filters as $filter)
	{
		if($filter->Expiredate != -1 && ($filter->Expiredate + $filter->Created) < time())
			$filter->Destroy();
		else if($filter->Filtername != OO_TRACKING_FILTER_NAME)
            $xml .= $filter->GetXML();
	}

    Server::$Response->Filters = "<dfi t=\"".base64_encode(count(DataManager::$Filters->Filters))."\" dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_FILTERS])."\">".$xml."</dfi>";
}

function buildEvents()
{
    Server::InitDataBlock(array("EVENTS"));
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_EVENTS,DATA_UPDATE_KEY_EVENTS))
    {
        Server::$Response->Events = "<ev dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_EVENTS])."\" nu=\"".base64_encode(1)."\" />";
        return;
    }
	Server::$Response->Events = "";
	if(!empty(Server::$Events))
    {
		foreach(Server::$Events->Events as $event)
			Server::$Response->Events .= $event->GetXML();
        Server::$Response->Events = "<ev dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_EVENTS])."\">\r\n" . Server::$Response->Events . "</ev>";
    }
}

function buildActions()
{
	
	Server::$Response->Actions = "";
    if(count(Server::$Events->Events)>0)
    {
        if($result = DBManager::Execute(true,"SELECT `trigger_id`,`action_id` FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."` INNER JOIN `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` ON `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`trigger_id`=`".DB_PREFIX.DATABASE_EVENT_TRIGGERS."`.`id` WHERE `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`receiver_user_id` = '".DBManager::RealEscape(CALLER_SYSTEM_ID)."' GROUP BY `action_id` ORDER BY `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`created` ASC"))
            while($row = DBManager::FetchArray($result))
            {
                $internalaction = new EventActionInternal($row);
                Server::$Response->Actions .= $internalaction->GetXML();
            }
	    DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."` WHERE `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."`.`receiver_user_id` = '".DBManager::RealEscape(CALLER_SYSTEM_ID)."';");
    }
}

function buildChatVouchers($typecond="")
{
	
    if(empty($_POST["p_ct_r"]))
        return;
    if($_POST["p_ct_r"] == XML_CLIP_NULL)
		$_POST["p_ct_r"] = 0;
    Server::$Response->ChatVouchers = "";
    if(!empty(Server::$Configuration->Database["cct"]))
    {
        $types = array();
        foreach(Server::$Operators[CALLER_SYSTEM_ID]->Groups as $gid)
            if(isset(Server::$Groups[$gid]) && is_array(Server::$Groups[$gid]->ChatVouchersRequired))
                foreach(Server::$Groups[$gid]->ChatVouchersRequired as $vid)
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
            if($result = DBManager::Execute(true,$d = "SELECT *,`t1`.`id` AS `voucherid` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`edited` > ".$_POST["p_ct_r"]." AND (" . $typecond . ") ORDER BY `t1`.`edited` ASC LIMIT " . DATA_ITEM_LOADS . ";"))
                while($row = DBManager::FetchArray($result))
                {
                    $voucher = new CommercialChatVoucher($row);
                    Server::$Response->ChatVouchers .= $voucher->GetXML();
                }
    }
}

function buildReports($xml="")
{
    if(empty($_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME]))
        return;
	if(empty(Server::$Statistic->CurrentDay) || Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_REPORTS) == PERMISSION_NONE)
		return;

	if($_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME] == XML_CLIP_NULL)
		$_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME] = "0_0";
	$parts = explode("_",$_POST[POST_INTERN_XMLCLIP_REPORTS_END_TIME]);

	if($result = DBManager::Execute(true,"SELECT *,(SELECT MAX(`time`) FROM `".DB_PREFIX.DATABASE_STATS_AGGS."`) AS `maxtime`,(SELECT MAX(`mtime`) FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE `maxtime`=`time`) AS `maxmtime` FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE (`time` = ".DBManager::RealEscape($parts[0])." AND `mtime` > ".DBManager::RealEscape($parts[1]).") OR (`time` > ".DBManager::RealEscape($parts[0]).") ORDER BY `time` ASC,`mtime` ASC LIMIT 1"))
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
					if(Server::$Statistic->CurrentDay->CreateVisitorList)
					{
						if(empty($row["aggregated"]) && (!@file_exists($report->GetFilename(true,true)) || ($row["time"] < (time()-StatisticProvider::$AutoUpdateTime))))
							$report->SaveVisitorListToFile();
						if(@file_exists($report->GetFilename(true,true)))
							$value = IOStruct::GetFile($report->GetFilename(true,true));
					}
					$type = 1;
				}
				else if($_POST[POST_INTERN_PROCESS_UPDATE_REPORT_TYPE]==0)
				{
					if(Server::$Statistic->CurrentDay->CreateReport)
					{
						if(empty($row["aggregated"]) && (!@file_exists($report->GetFilename(true,false)) || ($row["time"] < (time()-StatisticProvider::$AutoUpdateTime))))
						{
							$update = true;
							$report->SaveReportToFile();
						}
						else if(@file_exists($report->GetFilename(true,false)))
							$value = IOStruct::GetFile($report->GetFilename(true,false));
					}
					$type = 0;
				}
			}
			else
			{
				if(empty($row["aggregated"]) && (!@file_exists($report->GetFilename(true,false)) || ($row["time"] < (time()-StatisticProvider::$AutoUpdateTime))))
					$report->SaveReportToFile();
				if(@file_exists($report->GetFilename(true,false)))
					$value = IOStruct::GetFile($report->GetFilename(true,false));
				$type = ($report->Type == STATISTIC_PERIOD_TYPE_MONTH) ? 2 : 3;
			}
			if($type > -1)
			{
				$convrate = ($row["sessions"]>0) ? round(((100*$row["conversions"])/$row["sessions"]),StatisticProvider::$RoundPrecision) : 0;
				$chats = $chatsd = 0;
				
				$qmonth = ($report->Type == STATISTIC_PERIOD_TYPE_YEAR) ? "" : " AND `month`='".DBManager::RealEscape($row["month"])."'";
				$qday = ($report->Type != STATISTIC_PERIOD_TYPE_DAY) ? "" : " AND `day`='".DBManager::RealEscape($row["day"])."'";
				
				if($results = DBManager::Execute(true,"SELECT (SUM(`amount`)-SUM(`multi`)) AS `samount` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_CHATS."` WHERE `year`='".DBManager::RealEscape($row["year"])."'".$qmonth.$qday.""))
					if(DBManager::GetRowCount($results) == 1)
					{
						$rows = DBManager::FetchArray($results);
						if(is_numeric($rows["samount"]))
							$chats = $rows["samount"];
					}

                LocalizationManager::AutoLoad("",true);
                $value = Server::Replace($value,true,false,false,true);
				$xml .= "<r cid=\"".base64_encode(getId(3))."\" ragg=\"".base64_encode(empty($row["aggregated"]) ? 0 : 1)."\" rtype=\"".base64_encode($type)."\" convrate=\"".base64_encode($convrate)."\" chats=\"".base64_encode($chats)."\" update=\"".base64_encode(($update)?1:0)."\" visitors=\"".base64_encode($row["sessions"])."\" time=\"".base64_encode($row["time"])."\" mtime=\"".base64_encode($row["mtime"])."\" year=\"".base64_encode($row["year"])."\" month=\"".base64_encode($row["month"])."\" day=\"".base64_encode($row["day"])."\">".base64_encode($value)."</r>\r\n";
			}
			$xml .= "<ri maxtime=\"".base64_encode($row["maxtime"])."\" maxmtime=\"".base64_encode($row["maxmtime"])."\" />";
		}
	}
	Server::$Response->SetStandardResponse(1,$xml);
}

function buildResources($xml="",$count=0,$last=0)
{
    if(isset($_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME]))
    {
        if(Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_RESOURCES) == PERMISSION_NONE)
            return;

        $resources = array();
        if($_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME] == XML_CLIP_NULL)
            $_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME] = 0;

        if($result = DBManager::Execute(true,$d = "SELECT * FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `edited` > ".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_RESOURCES_END_TIME])." AND `edited`<=".DBManager::RealEscape(time())." AND `parentid`<>100 ORDER BY `edited` ASC"))
        {
            while($row = DBManager::FetchArray($result))
            {
                $resources[] = new KnowledgeBaseEntry($row);
            }
        }

        foreach($resources as $res)
        {
            if(++$count <= DATA_ITEM_LOADS || $res->Edited == $last)
            {

                $xml .= $res->GetXML();

                //logit($res->Title . " - ". $res->ParentId);
            }
            else
                break;

            $last = $res->Edited;
        }
    }
	Server::$Response->Resources = (strlen($xml) > 0) ? $xml : null;
}

function buildArchive($count=0,$last=0,$limit=0,$xml="")
{
	Server::InitDataBlock(array("INPUTS"));
	if(isset($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME]))
    {
        $_POST["DAUT"] = strval($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME]+1) . "000";
        if(!CacheManager::IsDataUpdate("DAUT",DATA_UPDATE_KEY_CHATS))
            return;

		$chats = array();
		if($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME] == XML_CLIP_NULL)
			$_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME] = 0;
		
		if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `html`!='0' AND `closed` > ".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME])." AND `closed` < ".DBManager::RealEscape(time())." AND `internal_id` !='0' ORDER BY `closed` ASC LIMIT " . (DATA_ITEM_LOADS*2)))
			while($row = DBManager::FetchArray($result))
            {
				$chats[$row["chat_id"]] = new Chat();
                $chats[$row["chat_id"]]->SetValues($row);
            }
	
	    $xml = "";
	    if($result = DBManager::Execute(true,"SELECT count(*) as `total` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `html`!='0' AND `closed` > ".DBManager::RealEscape($_POST[POST_INTERN_XMLCLIP_ARCHIVE_END_TIME])." AND `closed` < ".DBManager::RealEscape(time())." AND `internal_id` !='0' ORDER BY `closed` ASC"))
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

            $last = $chat->Closed;
		}
        if($limit > 0 || $count > 0)
	        $xml = "<l l=\"".base64_encode($limit)."\">".base64_encode($count)."</l>\r\n" . $xml;
	}
	Server::$Response->Archive = (strlen($xml) > 0) ? $xml : null;
}

function demandFeedback($xml="")
{
    $permission = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_FEEDBACK);
    if($permission == PERMISSION_NONE)
        return;

    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_FEEDBACKS,DATA_UPDATE_KEY_FEEDBACKS))
        return;

    $loads = (!empty($_POST["p_fb_l"]) && is_numeric($_POST["p_fb_l"])) ? $_POST["p_fb_l"] : DATA_DEMAND_LOADS;
    $limit = (!empty($_POST["p_fb_p"]) && is_numeric($_POST["p_fb_p"]) && $_POST["p_fb_p"]>1) ? ($_POST["p_fb_p"]-1)*$loads : 0;

    $sql_joined = array();
    $sort_direction = (!empty($_POST["p_fb_sd"]) && $_POST["p_fb_sd"]=="1") ? "DESC" : "ASC";
    $sort_column = (isset($_POST["p_fb_si"])) ? $_POST["p_fb_si"] : null;
    $search_value = (isset($_POST["p_fb_q"])) ? $_POST["p_fb_q"] : null;

    $sql_search_ijoin = $sql_sort_ijoin = $sql_sort_where = $sql_search_where = $sql_order = "";

    // sort
    if($sort_column !== null && isset(Server::$Configuration->Database["gl_fb"][$sort_column]))
    {
        $sql_sort_where = " WHERE `cid`='".DBManager::RealEscape($sort_column)."' ";
        $sql_order = " ORDER BY `value` ".$sort_direction." ";
    }
    else if(in_array($sort_column,array("h_fullname","h_email","h_company","h_phone")))
    {
        $sql_joined[DATABASE_USER_DATA] = true;
        $sql_sort_ijoin = " INNER JOIN `".DB_PREFIX.DATABASE_USER_DATA."` AS `t3` ON `t1`.`data_id`=`t3`.`id` ";
        $sql_order = " ORDER BY LOWER(`t3`.`".$sort_column."`) ".$sort_direction." ";
    }
    else if($sort_column == "o_fullname")
    {
        $sql_joined[DATABASE_OPERATORS] = true;
        $sql_sort_ijoin = " INNER JOIN `".DB_PREFIX.DATABASE_OPERATORS."` AS `t3` ON `t1`.`operator_id`=`t3`.`system_id` ";
        $sql_order = " ORDER BY LOWER(`t3`.`fullname`) ".$sort_direction." ";
    }
    else if($sort_column == "group")
    {
        $sql_order = " ORDER BY LOWER(`group_id`) ".$sort_direction." ";
    }
    else if(!empty($sort_column))
    {
        $sql_order = " ORDER BY `".$sort_column."` ".$sort_direction." ";
    }

    // search
    if(!empty($search_value))
    {
        if(!isset($sql_joined[DATABASE_USER_DATA]))
            $sql_search_ijoin = " INNER JOIN `".DB_PREFIX.DATABASE_USER_DATA."` AS `t4` ON `t1`.`data_id`=`t4`.`id` ";
        if(!isset($sql_joined[DATABASE_OPERATORS]))
            $sql_search_ijoin .= " INNER JOIN `".DB_PREFIX.DATABASE_OPERATORS."` AS `t5` ON `t1`.`operator_id`=`t5`.`system_id` ";

        if(empty($sql_sort_where))
            $sql_search_where = " WHERE ";
        else
            $sql_search_where .= " AND ";

        $q = DBManager::RealEscape(strtolower($search_value),true);
        $sql_search_where .= "(LOWER(`value`) LIKE '%".$q."%' OR LOWER(`group_id`) LIKE '%".$q."%' OR LOWER(`fullname`) LIKE '%".$q."%' OR LOWER(`h_fullname`) LIKE '%".$q."%' OR LOWER(`h_email`) LIKE '%".$q."%' OR LOWER(`h_company`) LIKE '%".$q."%' OR LOWER(`h_phone`) LIKE '%".$q."%')";
    }

    $sql_perm_where = ($permission==1) ? (" AND `operator_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'") : "";
    $sql_query = "SELECT t1.*,t2.* FROM `".DB_PREFIX.DATABASE_FEEDBACKS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_FEEDBACK_CRITERIA."` AS `t2` ON `t1`.`id`=`t2`.`fid`".$sql_sort_ijoin.$sql_search_ijoin.$sql_sort_where.$sql_search_where."AND `resource_id`=''".$sql_perm_where." GROUP BY `fid`".$sql_order;
    $result = DBManager::Execute(true,$d = ($sql_query . "LIMIT ".intval($limit).",".intval($loads).";"));

    if($result)
        while($row = DBManager::FetchArray($result))
        {
            $fb = new Feedback($row["id"],$row);
            $fb->LoadCriteriaList();
            $xml .= $fb->GetXML();
        }

    $q_count["total"] = "SELECT COUNT(*) AS `total`";
    $q_count["totalquery"] = "(SELECT COUNT(*) FROM (".$sql_query.") AS `stb`) AS `totalquery`";
    $result = DBManager::Execute(true,$q_count["total"].",".$q_count["totalquery"]." FROM `".DB_PREFIX.DATABASE_FEEDBACKS."` WHERE `resource_id`=''". $sql_perm_where);
    $row = DBManager::FetchArray($result);
    Server::$Response->Feedbacks = "<dfb t=\"".base64_encode($row["total"])."\" l=\"".base64_encode($loads)."\" q=\"".base64_encode($row["totalquery"])."\" dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_FEEDBACKS])."\">".$xml."</dfb>";
}

function demandReports()
{
    

    if(!STATS_ACTIVE || !isset($_POST["p_dr_p"]) || Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_REPORTS) == PERMISSION_NONE)
        return;

    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_REPORTS,DATA_UPDATE_KEY_REPORTS))
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

    $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE ".$type." ORDER BY `time` DESC,`mtime` DESC LIMIT ".$limit.",".DBManager::RealEscape(DATA_DEMAND_LOADS).";");
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
            if($results = DBManager::Execute(true,"SELECT (SUM(`amount`)-SUM(`multi`)) AS `samount` FROM `".DB_PREFIX.DATABASE_STATS_AGGS_CHATS."` WHERE `year`='".DBManager::RealEscape($row["year"])."'".$qmonth.$qday.""))
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
    $result = DBManager::Execute(true,"SELECT count(`time`) AS `total` FROM `".DB_PREFIX.DATABASE_STATS_AGGS."`;");
    $trow = DBManager::FetchArray($result);
    $result = DBManager::Execute(true,"SELECT count(`time`) AS `ttotal` FROM `".DB_PREFIX.DATABASE_STATS_AGGS."` WHERE ".$type.";");
    $ttrow = DBManager::FetchArray($result);
    Server::$Response->Reports = "<dr dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_REPORTS])."\" p=\"".base64_encode(DATA_ITEM_LOADS)."\" t=\"".base64_encode($trow["total"])."\" q=\"".base64_encode($ttrow["ttotal"])."\">\r\n" . $xml . "\r\n</dr>";
}

function demandEmails($xml="",$count=0,$lmc=0,$c_name="",$c_text="")
{
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_EMAILS,DATA_UPDATE_KEY_EMAILS))
        return;

    $result = DBManager::Execute(true,"SELECT `t1`.`email_id`,`t1`.`group_id` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_MAILBOXES."` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `t1`.`deleted`=0;");
    if($result)
    {
        //$permission = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_TICKETS);
        $permissione = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(22);

        while($row = DBManager::FetchArray($result))
        {
            $full = $permissione != PERMISSION_NONE;/* && ((in_array($row["group_id"],Server::$Operators[CALLER_SYSTEM_ID]->Groups) && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL)*/;
            if($full)
                $count++;
        }
    }

    if($count>0)
    {
        if(!empty($_POST["p_de_a"]) && is_numeric($_POST["p_de_a"]))
        {
            $result = DBManager::Execute(true,"SELECT `t1`.*,`t2`.`email` AS `receiver_mail` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_MAILBOXES."` AS `t2` ON `t1`.`mailbox_id`=`t2`.`id` WHERE `t1`.`deleted`=0 ORDER BY `created` ASC" . " LIMIT 0,".$_POST["p_de_a"].";");
            if($result)
                while($row = DBManager::FetchArray($result))
                {
                    $full = $permissione != PERMISSION_NONE;// && ((in_array($row["group_id"],Server::$Operators[CALLER_SYSTEM_ID]->Groups) && $permission != PERMISSION_NONE) || $permission == PERMISSION_FULL);
                    $email = new TicketEmail($row);
                    $email->LoadAttachments();
                    $xml .= $email->GetXML($full);
                }
        }
        $result = DBManager::Execute(true,"SELECT `created` AS `lmc`,sender_name,sender_email,body FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."') ORDER BY `created` DESC LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {
            $lmc = $row["lmc"];
            $c_name = cutString((!empty($row["sender_name"]) ? $row["sender_name"] : $row["sender_email"]),90);
            $c_text = cutString($row["body"],90);
        }
    }
    Server::$Response->Messages .= "<de dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_EMAILS])."\" lmc=\"".base64_encode($lmc)."\" lmn=\"".base64_encode($c_name)."\" lmt=\"".base64_encode($c_text)."\" c=\"".base64_encode($count)."\">\r\n" . $xml . "\r\n</de>";
}

function demandChats($xml="",$q_filter="",$q_searchw="")
{
    
    if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_CHATS,DATA_UPDATE_KEY_CHATS))
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
            $q = DBManager::RealEscape(strtolower($_POST["p_dc_q"]),true);
            $q_searchw = "LOWER(`fullname`) LIKE '%".$q."%' OR LOWER(`area_code`) LIKE '%".$q."%' OR LOWER(`html`) LIKE '%".$q."%'  OR LOWER(`plaintext`) LIKE '%".$q."%' OR LOWER(`transcript_text`) LIKE '%".$q."%' OR LOWER(`email`) LIKE '%".$q."%' OR LOWER(`company`) LIKE '%".$q."%' OR LOWER(`phone`) LIKE '%".$q."%' OR LOWER(`chat_id`) LIKE '%".$q."%' OR LOWER(`external_id`) LIKE '%".$q."%' OR LOWER(`question`) LIKE '%".$q."%'";
            $q_searchw = " AND (" . $q_searchw . ")";
        }
    }

    Server::InitDataBlock(array("INPUTS"));

    $q_base = "`closed`>0 AND `html`!='0'";
    $q_grperm = Chat::GetPermissionSQL(CALLER_SYSTEM_ID);

    if(!empty($q_filter))
        $q_filter = " AND (" . $q_filter . ")";

    $q_inner = "FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE ". $q_base . $q_filter . $q_searchw . $q_grperm ." ORDER BY `closed` DESC";

    $result = DBManager::Execute(true,"SELECT * " . $q_inner . " LIMIT ".$limit.",".DBManager::RealEscape($loads).";");
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

    $result = DBManager::Execute(true,$q_count["total"].",".$q_count["totalperm"].",".$q_count["totalquery"]." FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."`");
    $row = DBManager::FetchArray($result);
    $c_total = min($row["total"],$row["totalperm"]);
    $c_totalquery = min($row["totalquery"],$row["totalperm"]);
    Server::$Response->Archive .= "<dc dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_CHATS])."\" p=\"".base64_encode($loads)."\" t=\"".base64_encode($c_total)."\" q=\"".base64_encode($c_totalquery)."\">\r\n" . $xml . "\r\n</dc>";
}

function demandTickets($xml="",$q_filter="",$q_searchw="",$q_searchf="",$c_total=0,$c_totalread=0,$c_totalquery=0,$c_lmc=0,$c_name="",$c_text="",$loads=0)
{
    $permission = Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_TICKETS);
    if($permission != PERMISSION_NONE)
    {
        if(!CacheManager::IsDataUpdate(POST_INTERN_DUT_TICKETS,DATA_UPDATE_KEY_TICKETS))
            return;

        if(!isset($_POST["p_dt_c_id"]))
            $_POST["p_dt_c_id"] = $_POST["p_dt_u_id"] = "";

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
        $q_sort["id"] = " AND `deleted`=0 GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` " . (!empty($_POST["p_dt_s_d"]) ? $_POST["p_dt_s_d"] : "DESC");
        $q_sort["update"] = " AND `deleted`=0 GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`last_update` " . (!empty($_POST["p_dt_s_d"]) ? $_POST["p_dt_s_d"] : "DESC");
        $q_sort["wait"] = " AND `deleted`=0 GROUP BY `".DB_PREFIX.DATABASE_TICKETS."`.`id` ORDER BY `".DB_PREFIX.DATABASE_TICKETS."`.`wait_begin` " . (!empty($_POST["p_dt_s_d"]) ? $_POST["p_dt_s_d"] : "ASC");
        $sort_index = (!empty($_POST["p_dt_s"]) && !empty($q_sort[$_POST["p_dt_s"]])) ? $_POST["p_dt_s"] : "id";

        if(!(!empty($_POST["p_dt_mr"]) && is_numeric($_POST["p_dt_mr"])))
            $max_last_update_read = time()-(14*86400);
        else
            $max_last_update_read = $_POST["p_dt_mr"];

        $fchars=str_split($_POST["p_dt_f"]);
        foreach($fchars as $fchar)
            if(is_numeric($fchar))
                if(!empty($fchar))
                    $q_filter.= (empty($q_filter)) ? " `te`.`status`=".$fchar : " OR `te`.`status`=".$fchar;
                else
                    $q_filter.= (empty($q_filter)) ? " `te`.`status` IS NULL OR `te`.`status`=0" : " OR `te`.`status` IS NULL OR `te`.`status`=0";


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
                $q_filter.= "`te`.`editor_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'";
            else
                $q_filter = "(" . $q_filter . ") AND `te`.`editor_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."'";
        }

        if(!empty($_POST["p_dt_fg"]) && $permission == PERMISSION_FULL)
        {
            if(empty($q_filter))
                $q_filter.= "`target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";
            else
                $q_filter = "(" . $q_filter . ") AND `target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";
        }

        if(!empty($_POST["p_dt_q"]))
        {
            $q = DBManager::RealEscape(strtolower($_POST["p_dt_q"]),true);
            $q_searchf = " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` AS `tc` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tc`.`ticket_id`";
            $q_searchf .= " LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` AS `tm` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`tm`.`ticket_id` ";
            $q_searchf .= " LEFT JOIN `".DB_PREFIX.DATABASE_OPERATORS."` AS `do` ON `te`.`editor_id`=`do`.`system_id` ";
            $q_searchw = "LOWER(`do`.`fullname`) LIKE '%".$q."%' OR `tm`.`sender_id` LIKE '%".$q."%' OR `tm`.`ticket_id` LIKE '%".$q."%' OR LOWER(`tc`.`value`) LIKE '%".$q."%' OR LOWER(`tm`.`text`) LIKE '%".$q."%' OR LOWER(`tm`.`fullname`) LIKE '%".$q."%'  OR LOWER(`tm`.`email`) LIKE '%".$q."%' OR LOWER(`tm`.`company`) LIKE '%".$q."%' OR LOWER(`tm`.`phone`) LIKE '%".$q."%' OR LOWER(`tm`.`subject`) LIKE '%".$q."%'";

            if(!empty($_POST["p_dt_q_e"]))
            {
                $q_e = DBManager::RealEscape(strtolower($_POST["p_dt_q_e"]));
                $emails = explode(",",$q_e);
                foreach($emails as $email)
                    $q_searchw .= " OR LOWER(`tm`.`email`) LIKE '%".DBManager::RealEscape(trim($email),true)."%'";
            }

            $q_searchw = " AND (" . $q_searchw . ")";
        }

        Server::InitDataBlock(array("INPUTS"));
        $q_grperm = ($permission == PERMISSION_FULL) ? "" : "`target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."') AND ";
        $q_inner = "FROM `".DB_PREFIX.DATABASE_TICKETS."` LEFT JOIN `".DB_PREFIX.DATABASE_TICKET_EDITORS."` AS `te` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`te`.`ticket_id` ". $q_searchf ."WHERE ". $q_grperm ."`deleted`=0 AND (" . $q_filter . ")" . $q_searchw . $q_sort[$sort_index];
        $result = DBManager::Execute(true,$d = "SELECT * " . $q_inner . " LIMIT ".$limit.",".DBManager::RealEscape($loads).";");

        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $ticket = new Ticket($row,null,null);
                $ticket->LoadLogs();
                if(count($ticket->Messages) > 0)
                    $xml .= $ticket->GetXML(true,true);
            }

        $q_grperm = ($permission == PERMISSION_FULL) ? "" : " WHERE `target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."')";

        $q_count["total"] = "SELECT COUNT(*) AS `total`";
        $q_count["totalperm"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_TICKETS."`.`id` FROM `".DB_PREFIX.DATABASE_TICKETS."`". $q_grperm .") AS `sta`) AS `totalperm`";
        $q_count["totalquery"] = "(SELECT COUNT(*) FROM (SELECT `".DB_PREFIX.DATABASE_TICKETS."`.`id` ". $q_inner .") AS `stb`) AS `totalquery`";
        $q_count["totalread"] = (Server::$Operators[CALLER_SYSTEM_ID]->ClientWeb) ? ",(SELECT COUNT(*) FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `deleted`=0 AND `last_update`>".DBManager::RealEscape($max_last_update_read).") AS `totalread`" : "";

        $result = DBManager::Execute(true,$q_count["total"].",".$q_count["totalperm"].",".$q_count["totalquery"].$q_count["totalread"]." FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `deleted`=0;");
        $row = DBManager::FetchArray($result);

        if(!isset($row["totalread"]))
            $row["totalread"] = 0;

        $c_total = min($row["total"],$row["totalperm"]);
        $c_totalread = min($row["totalread"],$row["totalperm"]);
        $c_totalquery = min($row["totalquery"],$row["totalperm"]);
        $q_grperm = ($permission == PERMISSION_FULL) ? "" : "`target_group_id` IN ('".implode("','",Server::$Operators[CALLER_SYSTEM_ID]->Groups)."') AND ";

        $result = DBManager::Execute(true,"SELECT `t1`.`last_update` AS `lmc`,`fullname`,`text` FROM `".DB_PREFIX.DATABASE_TICKETS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` AS `t2` ON `t1`.`id`=`t2`.`ticket_id` WHERE ".$q_grperm."(`t2`.`type`=0 OR `t2`.`type`=3) ORDER BY `t1`.`last_update` DESC LIMIT 1;");

        if($result && $row = DBManager::FetchArray($result))
        {
            $c_lmc = $row["lmc"];
            $c_name = cutString($row["fullname"],90);
            $c_text = cutString($row["text"],90);
        }
    }
    Server::$Response->Messages .= "<dt u=\"".base64_encode($_POST["p_dt_u_id"])."\" c=\"".base64_encode($_POST["p_dt_c_id"])."\" dut=\"".base64_encode(CacheManager::$DataUpdateTimes[DATA_UPDATE_KEY_TICKETS])."\" lmc=\"".base64_encode($c_lmc)."\" lmn=\"".base64_encode($c_name)."\" lmt=\"".base64_encode($c_text)."\" p=\"".base64_encode($loads)."\" t=\"".base64_encode($c_total)."\" r=\"".base64_encode($c_totalread)."\" q=\"".base64_encode($c_totalquery)."\">\r\n" . $xml . "\r\n</dt>";
}

function buildNewPosts()
{
	
	foreach(Chat::GetMyPosts(Server::$Operators[CALLER_SYSTEM_ID]->SystemId) as $post)
	{
		Server::$Response->Posts .= $post->GetXml();
		Server::$Operators[CALLER_SYSTEM_ID]->SetRepostTime($post->ReceiverGroup,$post->Created);
	}
}

function buildIntern()
{
	
	$builder = new InternalXMLBuilder(Server::$Operators[CALLER_SYSTEM_ID]);
	$builder->Generate();

	Server::$Response->Internals = $builder->XMLInternal;
	Server::$Response->Typing .= $builder->XMLTyping;
	Server::$Response->InternalProfilePictures = $builder->XMLProfilePictures;
	Server::$Response->InternalWebcamPictures = $builder->XMLWebcamPictures;
	Server::$Response->Groups = $builder->XMLGroups;
	Server::$Response->InternalVcards = $builder->XMLProfiles;
}

function buildExtern()
{
	Server::$Response->Tracking = "";

	$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE `auto`=0 AND `closed`=0 AND `received`=0 ORDER BY `created` ASC;");
	while($row = DBManager::FetchArray($result))
	{
		$forward = new Forward($row);
		Server::$Response->Forwards .= $forward->GetXml();
		
		if(!empty(Server::$Visitors[$forward->ReceiverUserId]) && Server::$Visitors[$forward->ReceiverUserId]->GetBrowser($forward->ReceiverBrowserId) != null)
		{
			if(!$forward->Invite)
				Server::$Visitors[$forward->ReceiverUserId]->GetBrowser($forward->ReceiverBrowserId)->Forward=$forward;
			else if(CALLER_SYSTEM_ID == $forward->TargetSessId)
				$forward->Save(true,true);
		}
	}
	
	$isex = !empty(Server::$Operators[CALLER_SYSTEM_ID]->Groups) && Server::$Groups[Server::$Operators[CALLER_SYSTEM_ID]->Groups[0]]->IsExternal;
	$builder = new ExternalXMLBuilder(Server::$Operators[CALLER_SYSTEM_ID],Server::$Visitors,(NO_CLIPPING || isset($_POST[POST_INTERN_RESYNC])),$isex);
	$builder->SessionFileSizes = Server::$Operators[CALLER_SYSTEM_ID]->VisitorFileSizes;
	$builder->StaticReload = Server::$Operators[CALLER_SYSTEM_ID]->VisitorStaticReload;

	$base = array();
    $builder->SetDiscardedObject($base);
	$builder->Generate();
	Server::$Response->Tracking = $builder->XMLCurrent;

	foreach($builder->DiscardedObjects as $uid => $list)
	{
		Server::$Response->Tracking .= "<cd id=\"".base64_encode($uid)."\">\r\n";
		if($list != null)
			foreach($list as $bid)
				Server::$Response->Tracking .= " <bd id=\"".base64_encode($bid)."\" />\r\n";
		Server::$Response->Tracking .= "</cd>\r\n";
	}

	Server::$Response->Typing .= $builder->XMLTyping;
	Server::$Operators[CALLER_SYSTEM_ID]->VisitorFileSizes = $builder->SessionFileSizes;
	Server::$Operators[CALLER_SYSTEM_ID]->VisitorStaticReload = $builder->StaticReload;

	if($builder->GetAll && !LOGIN)
		Server::$Response->Tracking .= "<resync />\r\n";

	if(count(Server::$Visitors) == 0)
		Server::$Operators[CALLER_SYSTEM_ID]->VisitorFileSizes = array();
}

?>
