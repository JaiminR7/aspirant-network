/**
 * USER ACADEMIC/PROFESSIONAL STAGE CONSTANTS
 */

const STAGES = {
  SCHOOL: 'School',
  YEAR_1: '1st Year',
  YEAR_2: '2nd Year',
  YEAR_3: '3rd Year',
  YEAR_4: '4th Year',
  GRADUATE: 'Graduate',
  WORKING_PROFESSIONAL: 'Working Professional'
};

const STAGE_VALUES = Object.values(STAGES);

const getStageEnum = () => {
  return STAGE_VALUES;
};

module.exports = {
  STAGES,
  STAGE_VALUES,
  getStageEnum
};
