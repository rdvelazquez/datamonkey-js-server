##!/bin/bash
#PBS -l nodes=1:ppn=8

export PATH=/usr/local/bin:$PATH
source /etc/profile.d/modules.sh
module load aocc/1.2.1

FN=$fn
CWD=$cwd
TREE_FN=$tree_fn
STATUS_FILE=$sfn
PROGRESS_FILE=$pfn
RESULTS_FN=$rfn
GENETIC_CODE=$genetic_code

HYPHY=$CWD/../../.hyphy/hyphy

#export HYPHY_PATH=$CWD/../../.hyphy/res/
#ABSREL=$HYPHY_PATH/TemplateBatchFiles/SelectionAnalyses/aBSREL.bf

#echo "(echo '$GENETIC_CODE'; echo '$FN'; echo '$TREE_FN'; echo 5; echo 4;) | $HYPHY LIBPATH=$HYPHY_PATH $ABSREL"
#(echo $GENETIC_CODE; echo $FN; echo $TREE_FN; echo 5; echo 4;) | $HYPHY LIBPATH=$HYPHY_PATH $ABSREL > $PROGRESS_FILE
$HYPHY absrel --alignment $FN --tree $TREE_FN > $PROGRESS_FILE
