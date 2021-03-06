#!/bin/bash
#PBS -l nodes=1:ppn=16

export PATH=/usr/local/bin:$PATH
source /etc/profile.d/modules.sh

module load openmpi/gnu/1.6.3
module load aocc/1.2.1

FN=$fn
CWD=$cwd
TREE_FN=$tree_fn
STATUS_FILE=$sfn
PROGRESS_FILE=$pfn
RESULTS_FN=$rfn
GENETIC_CODE=$genetic_code
DATATYPE=$datatype
SUBSTITUTION_MODEL=$substitution_model
LENGTH=$length_of_each_chain
BURNIN=$number_of_burn_in_samples
SAMPLES=$number_of_samples
MAXIMUM_PARENTS=$maximum_parents_per_node
MINIMUM_SUBSTITUTIONS=$minimum_subs_per_site 

HYPHY=$CWD/../../.hyphy/HYPHYMP
HYPHY_PATH=$CWD/../../.hyphy/res/
BGM=$HYPHY_PATH/TemplateBatchFiles/BGM.bf
PVAL="0.1"

export HYPHY_PATH=$HYPHY_PATH

trap 'echo "Error" > $STATUS_FILE; exit 1' ERR

if [ $DATATYPE -eq 1 ]; then
  # Nucleotide data
  echo "(echo $DATATYPE; echo $FN; echo $TREE_FN; echo 1; echo $LENGTH; echo $BURNIN; echo $SAMPLES; echo $MAXIMUM_PARENTS; echo $MINIMUM_SUBSTITUTIONS; ) | $HYPHY LIBPATH=$HYPHY_PATH $BGM >> $PROGRESS_FILE"
  (echo $DATATYPE; echo $FN; echo $TREE_FN;  echo 1; echo $LENGTH; echo $BURNIN; echo $SAMPLES; echo $MAXIMUM_PARENTS; echo $MINIMUM_SUBSTITUTIONS; ) | $HYPHY LIBPATH=$HYPHY_PATH $BGM >> $PROGRESS_FILE
elif [ $DATATYPE -eq 2 ]; then
  # Amino acid
  echo "(echo $DATATYPE; echo $FN; echo $SUBSTITUTION_MODEL; echo $TREE_FN;  echo 1; echo $LENGTH; echo $BURNIN; echo $SAMPLES; echo $MAXIMUM_PARENTS; echo $MINIMUM_SUBSTITUTIONS; ) | $HYPHY LIBPATH=$HYPHY_PATH $BGM >> $PROGRESS_FILE"
  (echo $DATATYPE; echo $FN; echo $SUBSTITUTION_MODEL; echo $TREE_FN;  echo 1; echo $LENGTH; echo $BURNIN; echo $SAMPLES; echo $MAXIMUM_PARENTS; echo $MINIMUM_SUBSTITUTIONS; ) | $HYPHY LIBPATH=$HYPHY_PATH $BGM >> $PROGRESS_FILE
else
  # Codon
  echo "(echo $DATATYPE; echo $GENETIC_CODE; echo $FN; echo $TREE_FN;  echo 1; echo $LENGTH; echo $BURNIN; echo $SAMPLES; echo $MAXIMUM_PARENTS; echo $MINIMUM_SUBSTITUTIONS; ) | $HYPHY LIBPATH=$HYPHY_PATH $BGM >> $PROGRESS_FILE"
  (echo $DATATYPE; echo $GENETIC_CODE; echo $FN; echo $TREE_FN;  echo 1; echo $LENGTH; echo $BURNIN; echo $SAMPLES; echo $MAXIMUM_PARENTS; echo $MINIMUM_SUBSTITUTIONS; ) | $HYPHY LIBPATH=$HYPHY_PATH $BGM >> $PROGRESS_FILE
fi

echo "Completed" > $STATUS_FILE
