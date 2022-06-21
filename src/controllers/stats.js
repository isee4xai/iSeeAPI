const Usecase = require("../models/usecase");
const Interaction = require("../models/interaction");
const moment = require('moment');
const { now } = require("mongoose");


module.exports.getStats = async (req, res) => {
    try {
      const id = req.params.id;

      const startDate = moment(req.query.sd, 'DD-MM-YYYY').toDate()
      const endDate = moment(req.query.ed, 'DD-MM-YYYY').toDate()

      
      const query = {
        usecaseId: id,
      }

      if(startDate && !isNaN(startDate) && endDate && !isNaN(endDate)) {
        query.createdAt = {
          $gte :  startDate,
          $lt :  endDate
        }
      }
      else if(startDate && !isNaN(startDate)) {
        query.createdAt = {
          $gte :  startDate
        }
      }
      else if(endDate && !isNaN(endDate)) {
        query.createdAt = {
          $lt :  endDate
        }
      }

      const interactions = await Interaction.find(query);

      const usecase =   await Usecase.findById(id);
      const personas = usecase.personas;
  
      const InteractionPerPeriodes = () => {
        const result = {}
        
        const value = {
          "Week": 6.048e+8,
          "Day": 6.048e+8 / 7,
          "Hour": 6.048e+8 / 7 / 24
        }
  
        const dateList = interactions.map(interaction => interaction.createdAt).sort((date1, date2) => date1 - date2)
        

        const minDate = startDate && !isNaN(startDate) ? (startDate > dateList[0] ? dateList[0] : startDate ) : dateList[0];
        const maxDate = endDate && !isNaN(endDate) ? endDate < moment(Date.now()).toDate() ? endDate : moment(Date.now()).toDate() : moment(Date.now()).toDate();

        const weekDelta = (maxDate - minDate) / value.Week;
        const dayDelta = weekDelta * 7;  

        const unit = dayDelta > 1 ? "Day" :  "Hour";
  
        for (let index = minDate; index < moment(endDate && !isNaN(endDate) ? endDate : Date.now()).add(1, "days").toDate(); index.setDate(index.getDate() + 1)) {
          result[`${unit === "Hour" ? moment(index).format("HH:00") : moment(index).format("DD/MM")}`] = 0
        }

        console.log(result)
        dateList.forEach((date) => {
          console.log(date, moment(date).format("DD/MM"))
          const identifier = unit === "Hour" ? moment(date).format("HH:00") : moment(date).format("DD/MM") ;
          console.log(identifier)
          result[identifier] = result[identifier] + 1
        })
        console.log(result)

        return Object.entries(result).map(([key, value]) => ({
          label: key,
          interactions: value,
        }));
      }
  
  
  
  
  
  
  
  
  
  
      const InteractionPerPersona = () => {
        const result = [];
        interactions.forEach((interaction) => {
          const index = personas.findIndex((persona) => persona._id == interaction.personaId);
          if (index !== -1) {
            const personaName = personas[index].details.name;
  
            let resultIndex = result.findIndex((data) => data.persona == personaName);
            if (resultIndex === -1) {
              result.push({ persona: personaName, values: 0 });
              resultIndex = result.length - 1;
            }
  
            result[resultIndex].values = result[resultIndex].values + 1;
          }
        });
  
        return result;
      };
  
      res.json({
        interactions_per_date: InteractionPerPeriodes(),
        usage_per_persona: InteractionPerPersona()
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  module.exports.getPersonaIntentStats = async (req, res) => {
    try {
      // get all the intent with the right persona
      const startDate = moment(req.query.sd, 'DD-MM-YYYY').toDate()
      const endDate = moment(req.query.ed, 'DD-MM-YYYY').toDate()

      const query = {
        usecaseId: req.params.id,
        personaId: req.params.personaId,
      }

      if(startDate && !isNaN(startDate) && endDate && !isNaN(endDate)) {
        query.createdAt = {
          $gte :  startDate,
          $lt :  endDate
        }
      }
      else if(startDate && !isNaN(startDate)) {
        query.createdAt = {
          $gte :  startDate
        }
      }
      else if(endDate && !isNaN(endDate)) {
        query.createdAt = {
          $lt :  endDate
        }
      }

      const interactions = await Interaction.find(query);
  
      const usecase = await Usecase.findById(req.params.id);
  
      const evaluation = usecase.personas
        .filter((persona) => persona._id == req.params.personaId)[0]
        .intents.filter((intent) => intent.name == req.params.intent)[0]
        .evaluation.questions;
  
      // filter the question based on the desired intent
      const questionList = interactions.reduce((prev, interaction) => {
        return [
          ...prev,
          ...interaction.questions.filter(
            (question) => question.intent == req.params.intent
          ),
        ];
      }, []);
      // parse the question for the stats
  
      const getDefaultEvaluation = () => {
        return evaluation.reduce(
          (prev, { content, dimension, responseType: t }) => [
            ...prev,
            {
              question: content,
              responseType: t,
              dimension,
              values: [],
            },
          ],
          []
        );
      };
  
      const parseQuestions = (questionList) => {
        const questions = getDefaultEvaluation();
  
        questionList.forEach((question) => {
          let index = questions.findIndex((q) => q.question === question.content);
  
          if (index === -1) {
            questions.push({
              question: question.content,
              responseType: question.responseType,
              dimension: question.dimension,
              values: [],
            });
            index = questions.length - 1;
          }
  
          question.responseOptions.forEach(({ val }) => {
            const answerIndex = questions[index].values.findIndex(
              (answer) => answer.answer === val
            );
            if (answerIndex === -1)
              questions[index].values.push({ answer: val, values: 0 });
          });
  
          const answerIndex = questions[index].values.findIndex(
            (answer) => answer.answer === question.answer[0]
          );
          if (answerIndex === -1)
            questions[index].values.push({
              answer: question.answer[0],
              values: 1,
            });
          else
            questions[index].values[answerIndex].values =
              questions[index].values[answerIndex].values + 1;
        });
  
        return questions;
      };
      // return the stats
      res.json(parseQuestions(questionList));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  