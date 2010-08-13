<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"  xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:openSearch="http://a9.com/-/spec/opensearchrss/1.0/">
 
 <xsl:output method="html" />

  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////
  Licensed under GNU General Public License v2
  
  Version:  1.1
  Created:  March 22, 2009
  Creator:  Keith Chadwick
  Contact:  Keith.Chadwick@magma.ca
  
  For detailed information see http://keithchadwick.wordpress.com
  
  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////
  -->

  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  Define the configuration document along with configuration parameters
  and switches
  ///////////////////////////////////////////////////////////////////////////////////////////
-->

  <xsl:param name="doc">config.xml</xsl:param>
  <xsl:param name="config" select="document($doc)"/>

  <xsl:param name="encaseObject" select="$config/xmltojson/settings/encase/objectNames" />
  <xsl:param name="encaseString" select="$config/xmltojson/settings/encase/stringValues" />
  <xsl:param name="attPrefix" select="$config/xmltojson/settings/attributes/prefix" />
  <xsl:param name="attSuffix" select="$config/xmltojson/settings/attributes/suffix" />
  <xsl:param name="txtPrefix" select="$config/xmltojson/settings/elements/prefix" />
  <xsl:param name="txtSuffix" select="$config/xmltojson/settings/elements/suffix" />

  <xsl:param name="encaseForArray" select="$config/xmltojson/options/encaseforarray='true'"/>
  <xsl:param name="flattenSimpleElements" select="$config/xmltojson/options/flattenSimpleElements='true'"/>
  <xsl:param name="flattenSimpleCollectionsToArrays" select="$config/xmltojson/options/flattenSimpleCollectionsToArrays='true'"/>
  <xsl:param name="dropRoot" select="$config/xmltojson/options/dropRoot='true'"/>
  <xsl:param name="elementAppendForUnique" select="$config/xmltojson/options/elementAppendForUnique" />
  
  <xsl:param name="cln">: </xsl:param>
  
  <!-- 
  ///////////////////////////////////////////////////////////////////////////////////////////
  STEP 1: INITIALIZATION TEMPLATE
  
  Build the core JSON string then apply some of the basic final switches
  
  $initial_JSON:  holds the baseline JSON string created via the build template
  $JSON:          holds finalized JSON after $dropRoot parameter applied
  ///////////////////////////////////////////////////////////////////////////////////////////
  -->
	
	<xsl:template match="/">	
	
    <!-- Build the Initial JSON -->
    <xsl:variable name="initial_JSON">
      <xsl:apply-templates select="current()/child::*" mode="build" >
        <xsl:with-param name="path" select="'/'"/>
      </xsl:apply-templates>
    </xsl:variable>

    <!-- 
    Recast the variable to JSON and decide if we need to 
    strip the root node name by using some string manipulation.
    Otherwise simple recast the variable with {}
    -->
    
    <xsl:variable name="JSON">
      <xsl:choose>
        <xsl:when test="$dropRoot">
          <xsl:variable name="rootNode" select="name(/*[1])"/>
          <xsl:value-of select="substring-after($initial_JSON,concat($rootNode,$cln))"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="concat('{',$initial_JSON,'}')"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
     
    <!-- 
    Finally return the JSON and check if encase in array
    has been requested
    -->
    
    <xsl:if test="$encaseForArray=true()">[</xsl:if>
    <xsl:value-of select="$JSON"/>
    <xsl:if test="$encaseForArray=true()">]</xsl:if>

    <!--
    PROCESSING COMPLETED.....
    -->
  </xsl:template>

  
  
  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  STEP 2: ITERATIVE BUILD TEMPLATE

  Enumerate all of the nodes and build the JSON

  $path:        passed iteratively and used for datatype matching 
  $nName:       name of the current node
  $iPreceding:  numeric value containing count of preceding same 
                named nodes to $nName
  $iFollowing:  numeric value containing count of following same 
                named nodes to $nName
  $nameSuffix:  check for the caveat of an element name conflicting
                with a parent attribute. 
  ///////////////////////////////////////////////////////////////////////////////////////////
  -->
  <xsl:template match="*" mode="build">

    <xsl:param name="path"/>
    <xsl:variable name="nName" select="translate(name(.),':','$')"/>
    <xsl:variable name="iPreceding" select="count(preceding-sibling::*[name()=$nName])"/>
    <xsl:variable name="iFollowing" select="count(following-sibling::*[name()=$nName])"/>

    <xsl:variable name="nameSuffix">
      <xsl:if test="count(parent::*[name(@*)=$nName]) &gt; 0">
        <xsl:value-of select="$elementAppendForUnique"/>
      </xsl:if>
    </xsl:variable>

    <!--
    <xsl:value-of select="concat('  ||  ','Preceding:',$iPreceding,' Following:',$iFollowing,' xpath:',$path,' Name:',$nName,'  ||  ')"/>
    -->

    <!-- 
    Begin the decision tree for arrays, singletongs and flattened json
    -->
    <xsl:choose>

      <!--
      TYPE 1: ARRAY OBJECTS
      Current node has following siblings but no preceding elements
      therefore we must incase within an array
      -->
      <xsl:when test="$iPreceding = 0 and $iFollowing &gt; 0">

        <xsl:value-of select="concat($encaseObject,$nName,$nameSuffix,$encaseObject,$cln,'[')"/>

        <!-- 
        enumerate through same named nodes 
        -->
        <xsl:for-each select="../*[name()=$nName]">

          <xsl:variable name="nonSimpleChildrenCount">
            <xsl:call-template name="support-count-nonsimple-children">
              <xsl:with-param name="startNode" select="current()"/>
            </xsl:call-template>
          </xsl:variable>

          <xsl:variable name="isSimple" select="number($nonSimpleChildrenCount)=0"/>

          <xsl:variable name="json_content">
            <xsl:apply-templates select="current()" mode="process-node">
              <xsl:with-param name="path" select="$path"/>
              <xsl:with-param name="isSimpleNode" select="$isSimple"/>
              <xsl:with-param name="isCollection" select="true()"/>
            </xsl:apply-templates>
          </xsl:variable>

          <xsl:value-of select="$json_content"/>

          <!-- 
          if there are children then do an iterative call
          -->
          <xsl:if test="child::*">
            <xsl:if test="string-length($json_content) &gt; 1">
              <xsl:text>,</xsl:text>
            </xsl:if>
            <xsl:apply-templates select="current()/*" mode="build">
              <xsl:with-param name="path" select="concat($path,name(),'/')"/>
            </xsl:apply-templates>
          </xsl:if>

          <xsl:if test="($isSimple=false() and $flattenSimpleElements=true()) or $flattenSimpleElements=false()">
            <xsl:text>}</xsl:text>
          </xsl:if>

          <xsl:if test="position()!=last()">
            <xsl:text>,</xsl:text>
          </xsl:if>

        </xsl:for-each>

        <xsl:text>]</xsl:text>

        <xsl:if test="following-sibling::*[name()!=$nName]">
          <xsl:text>,</xsl:text>
        </xsl:if>
      </xsl:when>

      <!-- 
      TYPE 2: SINGLETON OBJECTS
      The current Node is a singleton with no siblings
      -->
      <xsl:when test="$iPreceding = 0 and $iFollowing = 0">

        <!-- get the simple status of the element -->
        <xsl:variable name="nonSimpleChildrenCount">
          <xsl:call-template name="support-count-nonsimple-children">
            <xsl:with-param name="startNode" select="current()"/>
          </xsl:call-template>
        </xsl:variable>
        <xsl:variable name="isSimple" select="number($nonSimpleChildrenCount)=0"/>

        <xsl:variable name="json_content">
          <xsl:apply-templates select="current()" mode="process-node">
            <xsl:with-param name="path" select="$path"/>
            <xsl:with-param name="isSimple" select="$isSimple"/>
            <xsl:with-param name="isCollection" select="false()"/>
          </xsl:apply-templates>
        </xsl:variable>

        <xsl:value-of select="concat($encaseObject, $nName, $nameSuffix, $encaseObject, $cln)"/>
        <xsl:value-of select="$json_content"/>

        <xsl:if test="child::*">
          <xsl:if test="string-length($json_content) &gt; 1">
            <xsl:text>,</xsl:text>
          </xsl:if>
          <xsl:apply-templates select="current()/*" mode="build">
            <xsl:with-param name="path" select="concat($path,$nName,'/')"/>
          </xsl:apply-templates>
        </xsl:if>

        <xsl:if test="($isSimple=false() and $flattenSimpleElements=true()) or $flattenSimpleElements=false()">
          <xsl:text>}</xsl:text>
        </xsl:if>

        <xsl:if test="following-sibling::*">
          <xsl:text>,</xsl:text>
        </xsl:if>

      </xsl:when>

    </xsl:choose>

  </xsl:template>


  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  STEP 3: PROCESS THE ELEMENT
  
  This template is called from the iterative Build template.  In my original
  blog post the below content was contained with the build template.
  However I move it to its on processing template due to duplication of code.
  It also makes it more readable.
  
  It is important to note that this template NEVER returns a trailing , in the JSON
  text.  That is the decision of the caller allways
  
  $path:      standard string variable containing the xpath to the passed node
  $isSimple:  when true indicates the current node can be treated as a simple elemented
    
  ///////////////////////////////////////////////////////////////////////////////////////////    
  -->
  <xsl:template match="*" mode="process-node">
    
    <xsl:param name="path" />
    <xsl:param name="isSimple"/>
    <xsl:param name="isCollection"/>

    <xsl:if test="($isSimple=false() and $flattenSimpleElements=true()) or $flattenSimpleElements=false()">
      <xsl:text>{</xsl:text>
    </xsl:if>

    <xsl:apply-templates select="@*" mode="process-attributes">
      <xsl:with-param name="path" select="concat($path,name(),'/')"/>
    </xsl:apply-templates>

    <xsl:if test="@* and string-length(text())!=0">
      <xsl:text>,</xsl:text>
    </xsl:if>
    
    <xsl:apply-templates select="." mode="process-element">
      <xsl:with-param name="path" select="concat($path,name(),'/')"/>
      <xsl:with-param name="isSimple" select="$isSimple"/>
      <xsl:with-param name="isCollection" select="$isCollection"/>
    </xsl:apply-templates>
    
  </xsl:template>

  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  STEP 4: PROCESS AN ELEMENT OR ATTRIBUTE
  
  These two templates process either a node attribute or node text in an 
  iterative fashion.
  
  $path:  standard string variable containing the xpath to the passed node
    
  ///////////////////////////////////////////////////////////////////////////////////////////    
  -->
  <xsl:template match="@*" mode="process-attributes">
    <xsl:param name="path"/>
    <xsl:param name="isSimple"/>

    <xsl:variable name="cleaned">
      <xsl:call-template name="process-string-content">
        <xsl:with-param name="valueToProcess" select="normalize-space(.)"/>
        <xsl:with-param name="path" select="concat($path,'@',name(),'/')"/>
      </xsl:call-template>
    </xsl:variable>
    <xsl:value-of select="concat($encaseObject,$attPrefix,name(),$attSuffix,$encaseObject,$cln,$cleaned)"/>
    <xsl:if test="position()!=last()">
      <xsl:text>,</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template match="*" mode="process-element">
    <xsl:param name="path"/>
    <xsl:param name="isSimple"/>
    <xsl:param name="isCollection"/>

    <xsl:variable name="value" select="normalize-space(text())"/>
    <xsl:if test="string-length($value)!=0">
      <xsl:variable name="cleaned">
        <xsl:call-template name="process-string-content">
          <xsl:with-param name="valueToProcess" select="$value"/>
          <xsl:with-param name="path" select="$path"/>
        </xsl:call-template>
      </xsl:variable>

      <xsl:choose>
        <xsl:when test="$isSimple=true() and $flattenSimpleElements=true()">
          <xsl:value-of select="$cleaned"/>
        </xsl:when>
        <xsl:when test="$isCollection=true() and $flattenSimpleCollectionsToArrays=true() and $flattenSimpleElements=true()">
          <xsl:value-of select="$cleaned"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="concat($encaseObject,$txtPrefix,$txtSuffix,$encaseObject,$cln,$cleaned)"/>
        </xsl:otherwise>
      </xsl:choose>

    </xsl:if>

  </xsl:template>

  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  STEP 5: PROCESS STRING CONTENT
  
  This template applyies the string escaping and datatyping of a value
  
  $value:       the value to be cleaned and or datatyped
  $path:        standard string variable containing the xpath to the passed node
  $nPtrs:       node set of config pointers used to datatype  
  $pathString:  the path value striped of its trailing / for nPtrs matching
  $datatype:    calculated datatype to apply to $value
  ///////////////////////////////////////////////////////////////////////////////////////////    
  -->
  <xsl:template name="process-string-content">

    <xsl:param name="path"/>
    <xsl:param name="valueToProcess"/>
    
    <xsl:variable name="value">
      <xsl:call-template name="support-escape-characters">
        <xsl:with-param name="cleanIt" select="$valueToProcess"/>
      </xsl:call-template>
    </xsl:variable>    
    
    <xsl:variable name="nPtrs" select="$config/xmltojson/pointers"/>
    <xsl:variable name="pathStrip" select="substring($path,1,string-length($path) -1)"/>

    <xsl:variable name="datatype">
      <xsl:choose>
        <xsl:when test="$nPtrs/pointer[text()=$pathStrip and @match='exact']">
          <xsl:value-of select="$nPtrs/pointer[text()=$pathStrip and @match='exact']/@type"/>
        </xsl:when>
        <xsl:when test="$nPtrs/pointer[contains($pathStrip,text()) and @match='any']">
          <xsl:value-of select="$nPtrs/pointer[contains($pathStrip,text()) and @match='any']/@type"/>
        </xsl:when>
        <xsl:when test="string(number($value))!='NaN'">
          <xsl:text>number</xsl:text>
        </xsl:when>
        <xsl:when test="translate($value,'true','TRUE')='TRUE' or translate($value,'false','FALSE')='FALSE'">
          <xsl:text>boolean</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>string</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:choose>
      
      <xsl:when test="$datatype='native'">
        <xsl:if test="string-length($value)=0">
          <xsl:text>{}</xsl:text>
        </xsl:if>
        <xsl:value-of select="$value"/>
      </xsl:when>
      
      <xsl:when test="$datatype='number'">
        <xsl:if test="string-length($value)=0">
          <xsl:text>null</xsl:text>
        </xsl:if>
        <xsl:value-of select="$value"/>
      </xsl:when>
      
      <xsl:when test="$datatype='boolean'">
        <xsl:choose>
          <xsl:when test="translate($value,'TRUE','true')='true' or $value='1'">
            <xsl:text>true</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>false</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      
      <!-- assumes a format of yyyy-mm-ddThh:mm:ss -->
      <xsl:when test="$datatype='date'">
        <xsl:value-of select="concat('new Date(',substring($value,1,4),',',number(substring($value,6,2))-1,',',substring($value,9,2),')')"/>
      </xsl:when>

      <!-- assumes a format of yyyy-mm-ddThh:mm:ss -->
      <xsl:when test="$datatype='datetime'">
        <xsl:value-of select="concat('new Date(',substring($value,1,4),',',number(substring($value,6,2))-1,',',substring($value,9,2),substring($value,12,2),',',substring($value,15,2),',',substring($value,18,2),')')"/>
      </xsl:when>

      <xsl:when test="$datatype='string'">
        <xsl:value-of select="concat($encaseString,$value,$encaseString)"/>
      </xsl:when>

    </xsl:choose>    
    
  </xsl:template>
  
  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  SUPPORT: CHECK FOR SIMPLE
  
  Checks to see if the passed node has simple children which are defined as each must
  be unique with no attributes or children of there own.
  
  Returns a count of the total found meeting each condition.  In order to be simple
  the template must return 0
  
  We auto throw in a 0 to ensure that errors do not occur on no child nodes
  ///////////////////////////////////////////////////////////////////////////////////////////
  -->
  <xsl:template name="support-count-nonsimple-children">
    <xsl:param name="startNode"/>

    <xsl:variable name="total">
      <xsl:text>0</xsl:text>
      <xsl:for-each select="$startNode">
        <xsl:variable name="nName" select="name($startNode)"/>
        <xsl:value-of select="number(count(current()/*)) + 
                              number(count(current()[@*])) + 
                              number(count(preceding-sibling::*[name()=$nName])) + 
                              number(count(following-sibling::*[name()=$nName]))"/>
      </xsl:for-each>
    </xsl:variable>

    <xsl:value-of select="number($total)"/>
  </xsl:template>

  <!--
  ///////////////////////////////////////////////////////////////////////////////////////////
  SUPPORT: ESCAPE CHARACTERS
  
  Applies Character escaping base on the escape nodes in the config file
  ///////////////////////////////////////////////////////////////////////////////////////////
  -->
  <xsl:template name="support-escape-characters">
    
    <xsl:param name="cleanIt"/>
    <xsl:param name="cleaned"/>
    <xsl:param name="nodePos" select="1"/>

    <xsl:variable name="escapeFrom" select="$config/xmltojson/escape/item[$nodePos]/from"/>
    <xsl:variable name="escapeTo" select="$config/xmltojson/escape/item[$nodePos]/to"/>

    <xsl:choose>
      <xsl:when test="string-length(substring-before($cleanIt,$escapeFrom))!=0 or starts-with($cleanIt,$escapeFrom)">
        <xsl:variable name="left" select="substring-before($cleanIt,$escapeFrom)"/>
        <xsl:call-template name="support-escape-characters">
          <xsl:with-param name="cleanIt" select="substring($cleanIt,number(string-length($left)+string-length($escapeFrom)+1),string-length($cleanIt))"/>
          <xsl:with-param name="cleaned" select="concat($cleaned,$left,$escapeTo)"/>
          <xsl:with-param name="nodePos" select="$nodePos"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="number($nodePos) &lt; count($config/xmltojson/escape/item)">
            <xsl:call-template name="support-escape-characters">
              <xsl:with-param name="cleanIt" select="concat($cleaned,$cleanIt)"/>
              <xsl:with-param name="nodePos" select="number($nodePos) + 1"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="concat($cleaned,$cleanIt)"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
    
  </xsl:template>
  
</xsl:stylesheet> 

