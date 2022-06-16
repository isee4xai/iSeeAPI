const Usecase = require("../models/usecase");
const Interaction = require("../models/interaction");

module.exports.create = async (req, res) => {
  const data = new Usecase(req.body);
  try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.get = async (req, res) => {
  try {
    const data = await Usecase.findById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

module.exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };

    const result = await Usecase.findByIdAndUpdate(id, updatedData, options);
    res.send(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.updateSettings = async (req, res) => {
  console.log("test");
  try {
    const id = req.params.id;
    const updatedData = { settings: req.body.settings };
    const options = { new: true };

    const result = await Usecase.findByIdAndUpdate(id, updatedData, options);
    if (result) {
      res.send(result);
    } else {
      res.status(404).json({ message: "Usecase not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports.list = async (req, res) => {
  try {
    const data = await Usecase.find({});
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Usecase.findByIdAndDelete(id);
    res.send(`Document with ${data.name} has been deleted..`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.updatePublish = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Usecase.findById(id);

    data.published = req.body.status;

    data.save();

    res.send(`Publish state of ${data.name} has been updated.`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.getStats = async (req, res) => {
  try {
    const id = req.params.id;
    // list of object with the conversation and the answers in it
    const interactions = await Interaction.find({ usecaseId: id });
    const personas = await Usecase.findById(id).personas;

    const filterInteractionByPersona = () => {
      const result = {};

      personas &&
        personas.forEach((persona) => {
          result[persona.details.name] = [];
        });

      interactions.forEach((interaction) => {
        result[interaction.personaId] = [
          ...(result[interaction.personaId] || []),
          interaction,
        ];
      });

      return result;
    };

    const filterQuestionByIntent = (personaName, personaInteractions) => {
      const result = {};
      const persona =
        personas && personas.filter((p) => p.details.name === personaName)[0];

      persona &&
        persona.intents.forEach((intent) => {
          result[intent.name] = [];
        });

      personaInteractions.forEach(({ questions }) => {
        questions.forEach((question) => {
          result[question.intent] = [
            ...(result[question.intent] || []),
            question,
          ];
        });
      });

      return result;
    };

    const parseQuestions = (questionList) => {
      const questions = {};

      questionList.forEach((question) => {
        if (
          question.responseType === "Free-text" ||
          question.responseType === "number"
        ) {
          questions[question.content] = [
            ...(questions[question.content] || []),
            question.answer[0],
          ];
        }
        if (
          question.responseType === "Likert" ||
          question.responseType === "Checkbox" ||
          question.responseType === "Radio"
        ) {
          if (!questions[question.content]) questions[question.content] = {};

          question.responseOptions.forEach(({ val }) => {
            questions[question.content][val] =
              questions[question.content][val] | 0;
          });

          questions[question.content][question.answer] =
            (questions[question.content][question.answer] | 0) + 1;
        }
      });

      return questions;
    };

    const parseQuestionsByPersonaAndIntent = () => {
      return Object.entries(filterInteractionByPersona()).reduce(
        (prev, [personaName, interaction]) => {
          return {
            ...prev,
            [personaName]: Object.entries(
              filterQuestionByIntent(personaName, interaction)
            ).reduce((prev, [personaName, questions]) => {
              return {
                ...prev,
                [personaName]: parseQuestions(questions),
              };
            }, {}),
          };
        },
        {}
      );
    };

    res.json(parseQuestionsByPersonaAndIntent());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.getPersonaIntentStats = async (req, res) => {
  try {
    // list of object with the conversation and the answers in it

    // get all the intent with the right persona
    const interactions = await Interaction.find({ 
      usecaseId: req.params.id, 
      personaId: req.params.personaId 
    });

    const usecase = await Usecase.findById(req.params.id)

    const evaluation = usecase.personas
    .filter((persona) => persona._id == req.params.personaId)[0]
    .intents.filter((intent) => intent.name == req.params.intent)[0]
    .evaluation.questions;
      

    // filter the question based on the desired intent
    const questionList = interactions.reduce((prev, interaction) => {
      return [...prev, ...interaction.questions.filter(question => question.intent == req.params.intent)]
    }, [])
    // parse the question for the stats

    const getDefaultEvaluation = () => {
      return evaluation.reduce((prev, {content, dimension, responseType: t}) => (
        [
          ...prev, {
            question: content,
            responseType: t,
            dimension,
            values: []
          }
      ]), [])
    }    

    const parseQuestions = (questionList) => {
      const questions = getDefaultEvaluation()

      console.log(questionList)

      questionList.forEach((question) => {
          let index = questions.findIndex(q => q.question === question.content);
        
          if(index === -1) {
            questions.push({
              question: question.content,
              responseType: question.responseType,  
              dimension: question.dimension,
              values: []
            })
            index = questions.length - 1;
          }


          question.responseOptions.forEach(({ val }) => {
            const answerIndex = questions[index].values.findIndex(answer => answer.answer === val)
            if (answerIndex === -1) questions[index].values.push({answer: val, values: 0})
          });

          const answerIndex = questions[index].values.findIndex(answer => answer.answer === question.answer[0])
          if (answerIndex === -1) questions[index].values.push({answer: question.answer[0], values: 1})
          else questions[index].values[answerIndex].values = questions[index].values[answerIndex].values  + 1
  
        })

        return questions
      }
      // return the stats
    res.json(parseQuestions(questionList));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};