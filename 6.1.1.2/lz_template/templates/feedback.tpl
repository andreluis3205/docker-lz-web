<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>LiveZilla</title>
    <meta name="description" content="LiveZilla Knowledgebase">
    <link rel="stylesheet" type="text/css" href="./templates/style_chat.min.css">
</head>
<body style="padding:10px;margin:0;text-align:center;">
<h2><!--title--></h2>
<h4><!--sub_title--></h4>
<form id="lz_feedback_form" method="POST">
<div style="display:none;" class="lz_index_red" id="missing_fields"><!--lang_client_fill_mandatory_fields--></div>
<table class="lz_chat_feedback_table" style="display:<!--visible-->;">
    <tr>
        <td>
            <!--criteria-->
        </td>
    </tr>
    <tr>
        <td style="text-align: center;"><input type="button" id="lz_chat_feedback_button" class="lz_form_button" onclick="lz_feedback_validate();" value="<!--lang_client_send-->"></td>
    </tr>
</table>
</form>
<script>
    var ids = new Array(<!--ids-->);
    function lz_feedback_set(_id,_obj,_number)
    {
        if(_number == document.getElementsByName("lz_feedback_value_"+_id)[0].value)
            _number--;

        for(var i=1;i<=5;i++)
            document.getElementById("lz_chat_star_"+_id+"_"+i.toString()).className = (_number >= i) ? "lz_chat_feedback_star lz_chat_feedback_star_full" : "lz_chat_feedback_star lz_chat_feedback_star_half";

        document.getElementsByName("lz_feedback_value_"+_id)[0].value=_number;
    }
    function lz_feedback_validate()
    {
        for(var i=0;i<ids.length;i++)
            if(document.getElementsByName("lz_feedback_value_"+ids[i])[0].value == "" || document.getElementsByName("lz_feedback_value_"+ids[i])[0].value == 0)
            {
                document.getElementById("missing_fields").style.display = "block";
                return;
            }
        document.getElementById("missing_fields").style.display = "none";
        document.getElementById("lz_feedback_form").submit();
    }
</script>
</body>
</html>