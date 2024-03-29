/**
 * Created by arjun010 on 12/28/15.
 */
(function() {
    ial = {};
    this.ialIdToDataMap  = {};
    this.useNormalizedAttributeWeights;
    /*
    * specialAttributeList is an optional list of one or more attributes
    * condition is either 'includeOnly','exclude'
    * */
    ial.init = function(passedData,normalizeAttributeWeights,specialAttributeList,condition) {
        normalizeAttributeWeights = typeof normalizeAttributeWeights !== 'undefined' ? normalizeAttributeWeights : 0;
        specialAttributeList = typeof specialAttributeList !== 'undefined' ? specialAttributeList : [];
        if(specialAttributeList.length>0){
            if(['includeOnly','exclude'].indexOf(condition)==-1){
                throw 'ERROR: condition must be "includeOnly" or "exclude"';
                return ;
            }
        }

        this.attrVector = {};
        this.dataSet = passedData;
        this.clusters = [];
        this.attributeWeightVector = {}; // map of attributes to weights in range [0,1]
        this.ialIdToDataMap  = {}; // map from ialId to actual data item
        this.attributeValueMap = {}; //will hold min, max and data types (may need more work for data types)
        this.activeAttributeCount = 0;
        this.sessionLogs = [];


        /*
        * initializing attributeWeightVector and attributeValueMap
        * */
        var attributeList = Object.keys(passedData[0]);
        for (var attribute in passedData[0]) {
            var shouldConsiderAttribute = 1;
            if (attribute == "ial");
            else {
                if(specialAttributeList.length>0){
                    if(condition=='includeOnly'){
                        if(specialAttributeList.indexOf(attribute)==-1){ // if specialAttributeList does not contain attribute, exclude
                            shouldConsiderAttribute = -1;
                        }
                    }else if(condition=='exclude'){
                        if(specialAttributeList.indexOf(attribute)>-1){ // if specialAttributeList contains attribute, exclude
                            shouldConsiderAttribute = -1;
                        }
                    }
                }
                if(shouldConsiderAttribute==1){
                    this.activeAttributeCount += 1;
                    this.attributeWeightVector[attribute] = 1.0;

                    if (!isNaN(passedData[0][attribute])){
                        this.attributeValueMap[attribute] = {
                            'min': parseFloat(passedData[0][attribute]),
                            'max': parseFloat(passedData[0][attribute]),
                            'dataType': 'numeric'
                        };
                    }else{ // need to change this part to handle categorical values
                        this.attributeValueMap[attribute] = {
                            'min': passedData[0][attribute],
                            'max': passedData[0][attribute],
                            'dataType': 'categorical'
                        };
                    }
                }
            }
        }
        if(normalizeAttributeWeights==1){
            this.useNormalizedAttributeWeights = 1;
            ial.normalizeAttributeWeightVector();
        }else{
            this.useNormalizedAttributeWeights = 0;
        }

        for (var index in passedData) {
            this.dataSet[index]["ial"] = {};
            this.dataSet[index]["ial"]["id"] = index;
            this.dataSet[index]["ial"]["weight"] = 1;
            this.ialIdToDataMap[index] = this.dataSet[index];

            /*
            * Finding min max for all attributes
            * */
            var dataItem = passedData[index];
            for(var attribute in this.attributeValueMap){
                if(!isNaN(dataItem[attribute])){
                    var curValue = parseFloat(dataItem[attribute]);
                    if(curValue<this.attributeValueMap[attribute]['min']){
                        this.attributeValueMap[attribute]['min'] = curValue;
                    }
                    if(curValue>this.attributeValueMap[attribute]['max']){
                        this.attributeValueMap[attribute]['max'] = curValue;
                    }
                }else{ // need to change this part to handle categorical values
                    if(dataItem[attribute]<this.attributeValueMap[attribute]['min']){
                        this.attributeValueMap[attribute]['min'] = dataItem[attribute];
                    }
                    if(dataItem[attribute]>this.attributeValueMap[attribute]['max']){
                        this.attributeValueMap[attribute]['max'] = dataItem[attribute];
                    }
                }
            }
        }
        for(var index in passedData){
            this.dataSet[index]["ial"]["itemScore"] = parseFloat(getItemScore(this.ialIdToDataMap[index],this.attributeWeightVector));
        }
    };


    /*
    * computes item score
    * params: data point object, current attribute weight vector
    * */
    function getItemScore(d,attributeVector){
        var score = 0.0;
        for(var attribute in attributeVector){
            if(attributeVector[attribute]>0.0 && !isNaN(d[attribute])){
                var attributeVal = ial.getNormalizedAttributeValue(d[attribute],attribute);
                attributeVal *= attributeVector[attribute];
                score += attributeVal;
            }
        }
        score = parseFloat(Math.round(score* 10000) / 10000).toFixed(4);
        return score;
    }


    /*
    * updates item scores for all data points
    * */
    ial.updateItemScores = function () {
        for(var ialId in this.ialIdToDataMap){
            var d = this.ialIdToDataMap[ialId];
            d.ial.itemScore = parseFloat(getItemScore(d,this.attributeWeightVector));
        }
    };

    /*
    * Normalize weight vector
    * */
    ial.normalizeAttributeWeightVector = function () {
        var activeSum = 0;
        for(var attribute in this.attributeWeightVector){
            if(this.attributeWeightVector[attribute]!=0.0){
                activeSum += this.attributeWeightVector[attribute];
            }
        }
        for(var attribute in this.attributeWeightVector){
            if(this.attributeWeightVector[attribute]!=0.0){
                this.attributeWeightVector[attribute] = this.attributeWeightVector[attribute]/activeSum;
            }
        }
    };


    /*
     * sets weight to new value
     * */
    ial.setItemWeight = function (d,newWeight,logEvent,additionalLogInfoMap) {
        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj(d);
        logObj.setOldWeight(d.ial.weight);
        logObj.setNewWeight(newWeight);
        logObj.setEventName('ItemWeightChange_SET');
        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }

        d.ial.weight = newWeight;

        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }
    };

    /*
    * increments weight by increment value
    * */
    ial.incrementItemWeight = function (d,increment,logEvent,additionalLogInfoMap) {
        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj(d);
        logObj.setOldWeight(d.ial.weight);
        logObj.setEventName('ItemWeightChange_CHANGE');

        d.ial.weight += increment;

        logObj.setNewWeight(d.ial.weight);
        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }

        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }
    };

    // returns the current attributeValueMap
    ial.getAttributeValueMap = function(){
        return clone(this.attributeValueMap);
    };

    /*
    * returns normalized value in [0,1] given an attribute's current value and name
    * ref: http://stackoverflow.com/questions/5294955/how-to-scale-down-a-range-of-numbers-with-a-known-min-and-max-value
    * */
    ial.getNormalizedAttributeValue = function(val,attribute) {
        if (this.attributeValueMap[attribute]['dataType'] != 'categorical') {
            var a = 0, b = 1;
            var min = this.attributeValueMap[attribute]['min'];
            var max = this.attributeValueMap[attribute]['max'];

            var normalizedValue;
            normalizedValue = ((b - a) * (val - min) / (max - min)) + a;
            return normalizedValue;
        } else { return val; }
    };

    /*
    * returns current attributeWeightVector
    * */
    ial.getAttributeWeightVector = function(){
        return clone(this.attributeWeightVector);
    };

    /*
    * returns requested attribute's weight
    * */
    ial.getAttributeWeight = function (attribute) {
        if (attribute in this.attributeWeightVector){
            return this.attributeWeightVector[attribute];
        }else{
            throw "Attribute not available or not specifed in weight vector during initialization."
        }
    };


    /*
    * sets attribute's weight to newWeight. Checks to ensure that the weight is always in [0.0,1.0]
    * */
    ial.setAttributeWeight = function(attribute,newWeight,logEvent,additionalLogInfoMap){

        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj(attribute);
        logObj.setOldWeight(this.attributeWeightVector[attribute]);
        logObj.setEventName('AttributeWeightChange_CHANGE');

        if(newWeight>1.0){
            this.attributeWeightVector[attribute] = 1.0;
        }else if(newWeight<0.0){
            this.attributeWeightVector[attribute] = 0.0;
        }else{
            this.attributeWeightVector[attribute] = newWeight;
        }


        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }
        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }

        ial.updateActiveAttributeCount();
        if(this.useNormalizedAttributeWeights==1){
            ial.normalizeAttributeWeightVector();
        }
        logObj.setNewWeight(this.attributeWeightVector[attribute]);
        ial.updateItemScores();
    };

    /*
    * Sets the attribute weight vector to the newly passed map
    * */
    ial.setAttributeWeightVector = function(newAttributeWeightVector){
        this.attributeWeightVector = clone(newAttributeWeightVector);
        for(var attribute in this.attributeWeightVector){
            if(this.attributeWeightVector[attribute]>1.0){
                this.attributeWeightVector[attribute] = 1.0
            }
            if(this.attributeWeightVector[attribute]<0.0){
                this.attributeWeightVector[attribute] = 0.0
            }
        }

        if(this.useNormalizedAttributeWeights==1){
            ial.normalizeAttributeWeightVector();
        }
        ial.updateItemScores();
    };


    /*
    * Private function to update active attribute counts based on attribute weight vector
    * */
    ial.updateActiveAttributeCount = function () {
        this.activeAttributeCount = 0;
        for(var attribute in this.attributeWeightVector){
            if(this.attributeWeightVector[attribute]>0.0){
                this.activeAttributeCount += 1;
            }
        }
    };

    /*
    * resets the attributeWeightVector to have all 1.0s
    * */
    ial.resetAttributeWeightVector = function (logEvent,additionalLogInfoMap) {
        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj();
        logObj.setOldWeight(clone(this.attributeWeightVector));
        logObj.setEventName('AttributeWeightChange_RESET');

        for(var attribute in this.attributeWeightVector){
            this.attributeWeightVector[attribute] = 1.0;
        }


        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }
        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }
        ial.updateActiveAttributeCount();

        if(this.useNormalizedAttributeWeights==1){
            ial.normalizeAttributeWeightVector();
        }
        logObj.setNewWeight(clone(this.attributeWeightVector));
        ial.updateItemScores();
    };

    /*
    * Nullifies attributeWeightVector to 0.0s
    * */
    ial.nullifyAttributeWeightVector = function (logEvent,additionalLogInfoMap) {

        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj();
        logObj.setOldWeight(clone(this.attributeWeightVector));
        logObj.setEventName('AttributeWeightChange_NULLIFY');

        for(var attribute in this.attributeWeightVector){
            this.attributeWeightVector[attribute] = 0.0;
        }

        logObj.setNewWeight(clone(this.attributeWeightVector));
        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }
        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }
        ial.updateActiveAttributeCount();
        ial.updateItemScores();
    };


    /*
    * Returns top N points based on interaction weight (a.k.a. weight)
    * */
    ial.getTopNPointsByInteractionWeights = function (N,logEvent,additionalLogInfoMap) {
        N = typeof N !== 'undefined' ? N : 1;
        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj();
        logObj.setOldWeight('');
        logObj.setEventName('GetTopN_ByInteractionWeight');


        var list = this.dataSet.slice(0);
        sortObj(list, 'ial.weight', 'd');

        logObj.setNewWeight('');
        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }
        logObj.setEventSpecificInfo({'dataReturned':list.slice(0,N),'N':N});
        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }

        return list.slice(0,N);
    };

    /*
     * Returns top N points based on interaction weight (a.k.a. weight)
     * */
    ial.getTopNPointsByScores = function (N,logEvent,additionalLogInfoMap) {
        N = typeof N !== 'undefined' ? N : 1;
        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj();
        logObj.setOldWeight('');
        logObj.setEventName('GetTopN_ByScore');


        var list = this.dataSet.slice(0);
        sortObj(list, 'ial.itemScore', 'd');

        var topNPoints = list.slice(0,N);
        logObj.setNewWeight('');
        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }
        logObj.setEventSpecificInfo({'dataReturned':topNPoints,'N':N});
        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }

        return topNPoints;
    };


    /*
     * return an array of the n most similar points to the given data point
     */
    ial.getNSimilarPoints = function(dataPoint, n,logEvent,additionalLogInfoMap) {

        logEvent = typeof logEvent !== 'undefined' ? logEvent : false;
        additionalLogInfoMap = typeof additionalLogInfoMap !== 'undefined' ? additionalLogInfoMap : {};

        var logObj = new LogObj(dataPoint);
        logObj.setOldWeight(dataPoint.ial.weight);
        logObj.setEventName('GetSimilarPoints');

        var id = dataPoint.ial.id;

        // locate the given point
        var dataPt;
        if (id in this.ialIdToDataMap) {
            dataPt = this.ialIdToDataMap[id];
        } else { return []; }

        var allPts = [];
        var similarPts = [];

        for (var i in this.dataSet) {
            // don't care to get the similarity with itself
            if (this.dataSet[i]["ial"]["id"] != id) {
                var similarityScore = ial.getSimilarityScore(dataPt, this.dataSet[i]);
                if (similarityScore != -1) {
                    var newPt = { "data" : this.dataSet[i], "similarity" : similarityScore };
                    allPts.push(newPt);
                } else
                    console.log("GetNSimilarPoints: Score of -1 between id " + id + " and id " + this.dataSet[i]["ial"]["id"]);
            }
        }

        allPts.sort(function(a, b) {
            return a["similarity"] - b["similarity"];
        });

        for (var i = 0; i < n; i++)
            similarPts.push(allPts[i]["data"]);

        logObj.setNewWeight(dataPoint.ial.weight);
        if(additionalLogInfoMap!={}){
            logObj.setCustomLogInfo(additionalLogInfoMap);
        }
        if(logEvent==true){
            this.sessionLogs.push(logObj);
        }

        return similarPts;
    };

    /*
     * get the similarity score of the two given items
     * lower value indicates more similar
     */
    ial.getSimilarityScore = function(dataPoint1, dataPoint2) {
        var id1 = dataPoint1.ial.id;
        var id2 = dataPoint2.ial.id;
        // locate the given points
        var dataPt1, dataPt2;

        if ((id1 in this.ialIdToDataMap) && (id2 in this.ialIdToDataMap)) {
            dataPt1 = this.ialIdToDataMap[id1];
            dataPt2 = this.ialIdToDataMap[id2];
        } else { return -1; }

        simScore = 0; 
        for (var attribute in this.attributeWeightVector) {
            var currentAttrWeight = this.attributeWeightVector[attribute];
            simScore += ((currentAttrWeight * 1.0 / this.activeAttributeCount) * ial.getNormalizedDistanceByAttribute(dataPt1, dataPt2, attribute));
        }

        if (simScore > 1 || simScore < 0) { console.log("GetSimilarityScore: invalid score " + simScore); }
        return simScore;
    };


    /* get the normalized distance between the two items with the given ids for the given attribute */
    ial.getNormalizedDistanceByAttribute = function(dataPoint1, dataPoint2, attribute) {
        var id1 = dataPoint1.ial.id;
        var id2 = dataPoint2.ial.id;

        // locate the given points
        var dataPt1, dataPt2;

        if ((id1 in this.ialIdToDataMap) && (id2 in this.ialIdToDataMap)) {
            dataPt1 = this.ialIdToDataMap[id1];
            dataPt2 = this.ialIdToDataMap[id2];
        } else { return -1; }

        var attrVal1, attrVal2;

        if (this.attributeValueMap[attribute]['dataType'] == 'categorical') {
            attrVal1 = ial.getNormalizedAttributeValue(dataPt1[attribute],attribute);
            attrVal2 = ial.getNormalizedAttributeValue(dataPt2[attribute],attribute);
            if (attrVal1 == attrVal2) // attributes are the same, distance = 0
                return 0;
            else // attributes are different, distance = 1
                return 1;
        } else { // numerical
            attrVal1 = ial.getNormalizedAttributeValue(parseFloat(dataPt1[attribute]),attribute);
            attrVal2 = ial.getNormalizedAttributeValue(parseFloat(dataPt2[attribute]),attribute);
            var attrRange = [ial.attributeValueMap[attribute]['min'], ial.attributeValueMap[attribute]['max']];
            return Math.abs((attrVal1) - (attrVal2)) / (attrRange[1] - attrRange[0]);
        }
    };

    /*
    * Returns a copy of the session logs collected so far
    * */
    ial.getSessionLogs = function(){
        return this.sessionLogs.slice(0);
    };

    /*
    * Returns the subset of logs which involve data items.
    * */
    ial.getDataItemLogs = function(){
        var dataItemLogList = [];
        for(var i in this.sessionLogs){
            var logObj = this.sessionLogs[i];
            if(logObj.eventName.indexOf('ItemWeightChange')>-1){
                dataItemLogList.push(logObj);
            }
        }

        return dataItemLogList;
    };


    /*
     * Returns the subset of logs which involve attributes.
     * */
    ial.getAttributeLogs = function () {
        var dataItemLogList = [];
        for(var i in this.sessionLogs){
            var logObj = this.sessionLogs[i];
            if(logObj.eventName.indexOf('AttributeWeightChange')>-1){
                dataItemLogList.push(logObj);
            }
        }
        return dataItemLogList;
    };

    /*
    * Returns an attribute weight vector generated based on similarity between given points
    * */
    ial.generateAttributeWeightVectorUsingSimilarityBetweenPoints = function (d1,d2) {
        var tempAttributeWeightVector = {};
        for(var attribute in this.attributeWeightVector){
            var val1 = this.getNormalizedAttributeValue(d1[attribute],attribute);
            var val2 = this.getNormalizedAttributeValue(d2[attribute],attribute);
            if(this.attributeValueMap[attribute]['dataType']!='categorical'){
                var diff = Math.abs(val1-val2);
                tempAttributeWeightVector[attribute] = 1.0-diff;
            }else{
                if(val1 == val2){
                    tempAttributeWeightVector[attribute] = 1.0;
                }else{
                    tempAttributeWeightVector[attribute] = 0.0;
                }
            }
        }
        return tempAttributeWeightVector;
    };


    /*
     * Returns an attribute weight vector generated based on difference between given points
     * */
    ial.generateAttributeWeightVectorUsingDifferenceBetweenPoints = function (d1,d2) {
        var tempAttributeWeightVector = {};
        for(var attribute in this.attributeWeightVector){
            var val1 = this.getNormalizedAttributeValue(d1[attribute],attribute);
            var val2 = this.getNormalizedAttributeValue(d2[attribute],attribute);
            if(this.attributeValueMap[attribute]['dataType']!='categorical'){
                var diff = Math.abs(val1-val2);
                tempAttributeWeightVector[attribute] = diff;
            }else{
                if(val1 == val2){
                    tempAttributeWeightVector[attribute] = 0.0;
                }else{
                    tempAttributeWeightVector[attribute] = 1.0;
                }
            }
        }
        return tempAttributeWeightVector;
    };

    /*
    * --------------------
    *         KNN
    * --------------------
    * */

    ial.createClusters = function(dataPoints) {
        dataPoints = typeof dataPoints !== 'undefined' ? dataPoints : this.dataSet;
        this.clusters = this.classify(dataPoints);
        return this.clusters;
    };

    ial.classify = function(dataPoints) {
        var aggregateScores = [];
        var knnDistance = 0.05;

        var tempStringId = 10,
            tempStringValMap = {};

        /* Use the attribute weight vector for these computations. */
        for (var index in dataPoints) {
            aggregateScores[index] = {};
            aggregateScores[index]["ial"] = {};
            aggregateScores[index]["ial"]["id"] = dataPoints[index]["ial"]["id"];
            aggregateScores[index]["ial"]["aggregateScore"] = 0;
            for (var attributeName in this.attributeWeightVector) {
                var attributeValue = ial.getNormalizedAttributeValue(dataPoints[index][attributeName],attributeName);
                var attributeWeight = this.attributeWeightVector[attributeName];

                if(attributeName!='ial'){
                    if(this.attributeValueMap[attributeName]['dataType']=='categorical'){
                        if (Object.keys(tempStringValMap).indexOf(attributeValue) == -1) { // if string not found in tempStringValMap i.e. is a new category string
                            tempStringValMap[attributeValue] = tempStringId;
                            attributeValue = tempStringId;
                            tempStringId += 10;
                        } else {
                            attributeValue = tempStringValMap[attributeValue];
                        }
                        aggregateScores[index]["ial"]["aggregateScore"] += attributeValue * attributeWeight;
                    }else{
                        aggregateScores[index]["ial"]["aggregateScore"] += attributeValue * attributeWeight;
                    }
                }
                //
                //if (isNaN(attributeValue) && attributeName!='ial') {
                //    if (Object.keys(tempStringValMap).indexOf(attributeValue) == -1) { // if string not found
                //        tempStringValMap[attributeValue] = tempStringId;
                //        attributeValue = tempStringId;
                //        tempStringId += 10;
                //    } else {
                //        attributeValue = tempStringValMap[attributeValue];
                //    }
                //}
                //
                //if (attributeName != "ial" && isNaN(attributeValue) == false && attributeWeight>0.0) {
                //    //attributeValue = ial.getNormalizedAttributeValue(attributeValue,attributeName); // Using normalized attribute values for computation
                //    aggregateScores[index]["ial"]["aggregateScore"] += attributeValue * attributeWeight;
                //}

            }
            aggregateScores[index]["ial"]["aggregateScore"] *= dataPoints[index]["ial"]["weight"];
        }

        aggregateScores.sort(function(a, b) {
            return b["ial"]["aggregateScore"] - a["ial"]["aggregateScore"];
        });

        var clusters = [];
        var clusterIndex = -1;
        for (var index in aggregateScores) {
            if (clusters.length == 0) {
                clusterIndex += 1;
                var cluster = new Cluster(clusterIndex);
                var curDataObj = ial.ialIdToDataMap[aggregateScores[index]["ial"]["id"]];
                curDataObj.ial.KNNClusterId = cluster.getClusterId();
                cluster.addDataPoint(curDataObj);
                clusters.push(cluster);
            } else {
                var previousObject = aggregateScores[index - 1];
                var currentObject = aggregateScores[index];

                if (Math.abs(currentObject["ial"]["aggregateScore"] - previousObject["ial"]["aggregateScore"]) <= knnDistance) {
                    var curDataObj = this.ialIdToDataMap[currentObject["ial"]['id']];
                    curDataObj.ial.KNNClusterId = cluster.getClusterId();
                    cluster.addDataPoint(curDataObj);
                } else {
                    clusterIndex += 1;
                    var cluster = new Cluster(clusterIndex);
                    var curDataObj = this.ialIdToDataMap[aggregateScores[index]["ial"]['id']];
                    curDataObj.ial.KNNClusterId = cluster.getClusterId();
                    cluster.addDataPoint(curDataObj);
                    clusters.push(cluster);
                }
            }
        }
        return clusters;
    };

    /*
     * Cluster data structure
     * */

    var Cluster = function(id) {
        this.clusterId = id;
        this.clusterName = "";
        this.dataPoints = [];
    };

    Cluster.prototype.getClusterId = function() {
        return this.clusterId;
    };

    Cluster.prototype.setClusterName = function(name) {
        this.clusterName = name;
    };

    Cluster.prototype.getClusterName = function() {
        return this.clusterName;
    };

    Cluster.prototype.addDataPoint = function(dataObject) {
        this.dataPoints.push(dataObject);
    };

    Cluster.prototype.getClusterDataPoints = function() {
        return this.dataPoints;
    };



    /*
    * Log object data structure
    * */

    var LogObj = function (d,tStamp) {
        d = typeof d !== 'undefined' ? d : '';

        this.dataItem = d;
        this.eventName = '';
        this.oldWeight = '';
        this.newWeight = '';
        this.customLogInfo = {};
        this.eventSpecificInfo = {};

        tStamp = typeof tStamp !== 'undefined' ? tStamp : new Date();

        this.eventTimeStamp = tStamp;
    };

    LogObj.prototype.setEventSpecificInfo = function(eventInfoMap) {
        this.eventSpecificInfo = eventInfoMap;
    };

    LogObj.prototype.setNewWeight = function(weight) {
        this.newWeight = weight;
    };

    LogObj.prototype.setOldWeight = function(weight) {
        this.oldWeight = weight;
    };

    LogObj.prototype.setEventName = function(ev) {
        this.eventName = ev;
    };

    LogObj.prototype.setCustomLogInfo = function(customLogInfoMap) {
        this.customLogInfo = clone(customLogInfoMap);
    };


    /*
    * ---------------------
    *   Utility functions
    * ---------------------
    * */

    function clone(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    // private
    function sortObj(list, key, order) {
        order = typeof order !== 'undefined' ? order : 'a';
        function compare(a, b) {
            if(key == "ial.weight" || key == "ial.id" || key == "ial.itemScore") {
                a = a["ial"][key.split('.')[1]];
                b = b["ial"][key.split('.')[1]];
            } else {
                a = a[key];
                b = b[key];
            }
            var type = (typeof(a) === 'string' ||
            typeof(b) === 'string') ? 'string' : 'number';
            var result;
            if (type === 'string') result = a.localeCompare(b);
            else {
                if (order == 'a') {
                    result = a - b;
                } else if (order == 'd') {
                    result = b - a;
                }
            }
            return result;
        }
        return list.sort(compare);
    }
})();