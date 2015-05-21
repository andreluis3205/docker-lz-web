<?php
/****************************************************************************************
 * LiveZilla commonTranslationFunctions.php
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function findMissingStrings($translationStrings, $existingArray)
{
    $missingTranslationStrings = array();
    foreach ($translationStrings as $aString) {
        $compareString = str_replace("\'", "'", $aString);
        if (!in_array($compareString, $existingArray)) {
            array_push($missingTranslationStrings, $aString);
        }
    }
    return $missingTranslationStrings;
}

function findSupernumeraryStrings($translationStrings, $existingArray)
{
    $supernumeraryTranslationStrings = array();
    foreach ($existingArray as $aString) {
        if (!in_array(str_replace("'", "\'", $aString), $translationStrings)) {
            array_push($supernumeraryTranslationStrings, $aString);
        }
    }
    return $supernumeraryTranslationStrings;
}

function findDoubleLangFileEntries($existingArray)
{
    $langFile = dirname(__FILE__) . '/langmobileorig.php';
    $fileContents = file_get_contents($langFile);
    $fileContents = preg_replace('/\n/', ' ', $fileContents);
    $fileContents = preg_replace('/\r/', ' ', $fileContents);
    $fileContents = preg_replace('/\t/', ' ', $fileContents);

    preg_match_all('/\[".*?"\]/s', $fileContents, $langStringIds);

    $stringIdEntries = array();
    $stringEntries = array();
    $doubleEntries = array();
    for ($i=0; $i<count($langStringIds[0]); $i++) {
        $tmpString = $langStringIds[0][$i];
        $tmpStringLength = strlen($tmpString);
        $tmpString = substr($tmpString, 2, $tmpStringLength - 4);
        if (!in_array($tmpString, $stringIdEntries)) {
            array_push($stringIdEntries, $tmpString);
        } else {
            array_push($doubleEntries, $tmpString . " <<< " . $existingArray[$tmpString]);
        }
        if (!in_array($existingArray[$tmpString], $stringEntries)) {
            array_push($stringEntries, $existingArray[$tmpString]);
        } else {
            array_push($doubleEntries, $tmpString . " >>> " . $existingArray[$tmpString]);
        }
    }
    return $doubleEntries;
}

function compareTranslationFiles($origArray) {
    $LZLANG = array();
    $errorValues = array();
    require 'langmobilede.php';
    $origKeys = array_keys($origArray);
    $deKeys = array_keys($LZLANG);

    for ($i=0; $i<count($origKeys); $i++) {
        if (!in_array($origKeys[$i], $deKeys)) {
            array_push($errorValues, $origKeys[$i] . " orig >>> de");
        }
    }
    for ($i=0; $i<count($deKeys); $i++) {
        if (!in_array($deKeys[$i], $origKeys)) {
            array_push($errorValues, $deKeys[$i] . " orig <<< de");
        }
    }
    return $errorValues;
}

function getAllSourceCodeFiles($onlyLoginFiles = false)
{
    $currentDir = dirname(__FILE__);
    $sourceCodeDirs = array($currentDir . '/../../js/lzm/', $currentDir . '/../../js/lzm/classes/');
    $sourceCodeFiles = array();

    if (!$onlyLoginFiles) {
        for ($i = 0; $i < count($sourceCodeDirs); $i++) {
            $tmpSourceCodeFiles = scandir($sourceCodeDirs[$i]);
            foreach ($tmpSourceCodeFiles as $aFile) {
                if (preg_match('/\.js$/', $aFile) != 0) {
                    array_push($sourceCodeFiles, $sourceCodeDirs[$i] . $aFile);
                }
            }
        }
    } else {
        array_push($sourceCodeFiles, $sourceCodeDirs[0] . 'index.js');
        array_push($sourceCodeFiles, $sourceCodeDirs[0] . 'configure.js');
        $tmpSourceCodeFiles = scandir($sourceCodeDirs[1]);
        foreach ($tmpSourceCodeFiles as $aFile) {
            if (preg_match('/Common.*\.js$/', $aFile) != 0) {
                array_push($sourceCodeFiles, $sourceCodeDirs[1] . $aFile);
            }
        }
    }
    //$sourceCodeFiles[] = $currentDir . '/testFile.js';
    return $sourceCodeFiles;
}

function parseSourceCodeFile($aFile)
{
    $fileContents = file_get_contents($aFile);
    $fileContents = preg_replace('/\n/', ' ', $fileContents);
    $fileContents = preg_replace('/\r/', ' ', $fileContents);
    $fileContents = preg_replace('/\t/', ' ', $fileContents);
    preg_match_all('/(?<![a-zA-Z])t\([^\[\]]*?(\[{2}.*?\]{2}[\s]*|\')\)/s', $fileContents, $foundMatches);

    $foundMatches = $foundMatches;
    $translationStrings = array();
    foreach ($foundMatches[0] as $aString) {
        $tmpString = preg_replace('/t\(\'/', '', $aString);
        $tmpString = preg_replace('/\',[\s]*\[\[.*\]\][\s]*\)/s', '', $tmpString);
        $tmpString = preg_replace('/\'\)/s', '', $tmpString);
        if (preg_match('/^t\(/', $tmpString) == null) {
            array_push($translationStrings, $tmpString);
        }
    }

    return $translationStrings;
}

function createLoginTranslationString($origArray) {
    $sourceCodeFiles = getAllSourceCodeFiles(true);

    $translationStrings = array();
    foreach ($sourceCodeFiles as $aFile) {
        foreach (parseSourceCodeFile($aFile) as $aString) {
            if (!in_array($aString, $translationStrings)) {
                array_push($translationStrings, $aString);
            }
        }
    }

    $LZLANG = array();
    require 'langmobilede.php';

    $tmpArray = array();
    $jsString = 'var translationData = [';
    foreach ($translationStrings as $fileString) {
        foreach ($origArray as $aKey => $aString) {
            //echo $aString . ' --- ' . $fileString . '<br />';
            if (str_replace("'", "\'", $aString) == $fileString) {
                array_push($tmpArray, $aString);
                $jsString .= '{"key": \'' . $aKey . '\', "orig": \'' . str_replace("'", "\'", str_replace('<', '&lt;', $aString)) . '\', "de": \'' . str_replace("'", "\'", str_replace('<', '&lt;', $LZLANG[$aKey])) . '\'}, ';
            }
        }
    }
    $jsString = rtrim($jsString, ', ') . '];';
    echo $jsString . "<br /><br />";

    if (count($translationStrings) == count($tmpArray)) {
        return $tmpArray;
    } else {
        echo "AN ERROR OCCURED WHILE CRATING THE ARRAY!";
        return array();
    }
}

?>
