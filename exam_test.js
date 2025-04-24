import http from 'k6/http';
import { check } from 'k6';


const UTILITY_BASE_URL = 'https://test.utkorsho.org/utility-service/api/v1';
const COURSE_BASE_URL = 'https://test.utkorsho.org/course-service/api/v1';
const USER_BASE_URL = 'https://test.utkorsho.org/user-service';
const QUESTION_EXAM_BASE_URL = 'https://test.utkorsho.org/question-exam-service/api/v1';
const PROFILE_URL = `${USER_BASE_URL}/api/v1/users/logged-in-user-info`
const USER_COURSE_URL = `${COURSE_BASE_URL}/user-courses`;
const QUESTION_SET_URL = `${QUESTION_EXAM_BASE_URL}/questionsets`;
const COURSE_BY_SESSION_URL = `${COURSE_BASE_URL}/courses/by-session`;
const ALL_SESSIONS_URL = `${UTILITY_BASE_URL}/sessions`;
const ACCESS_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJ0eXBlIjoiQUNDRVNTX1RPS0VOIiwic2siOiJkY2Y3Zjc3ZWxmOTg4MWxmNGZkOWxmYTg2ZWxmMGJjN2I2YWNhNTc5Iiwic3ViIjoiNmQxZTQ2ZWItNjU0My00Yzk5LWFlN2EtYjc5ZGU4OTBlYTg5IiwiaWF0IjoxNzQ1NTA0Njg0LCJleHAiOjE3NDU1MDgyODR9.ODvONd-LjC1GHiN7mx6MxJH47qYqCx1_wpHvFexVdwh-mOV2LeglDQGZetebJErd';


export let options = {
    stages: [
        { duration: '1m', target: 10 },
        // {duration: '30s', target: 1000},
        // {duration: '20s', target: 2000},
        // { duration: '2m', target: 5000 },
        // { duration: '2m', target: 5000 },
        // {duration: '20s', target: 3000},
        // {duration: '20s', target: 1500},
        // {duration: '20s', target: 500},
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000']           // <1% errors allowed
    },
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
};

// export let options = {
//     iterations: 5,
//     thresholds: {
//         http_req_duration: ['p(95)<5000']           // <1% errors allowed
//     },
//     summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
// };

export function setup() {
    return bulkLogin();
}

export default function (tokens) {
    // if (!userId) {
    //     return;
    // }
    // getUserCourses();
    // select a random token
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    getProfile(token);
    startExam(token, true);
    // const sessions = getSessions();
    //
    // if (!sessions) {
    //     return;
    // }
    // // extract the ids from the session array
    // const sessionIds = sessions.map(session => session.id);
    // // make a request to get courses by each session
    // sessionIds.forEach(getCourseBySessionId);
}

function bulkLogin() {
    let tokens = [];
    for (let i = 1711111001; i <= 1711111100; i++) {
        const loginId = `+880${i}`;
        const password = "123456";
        const payload = JSON.stringify({
            loginId: loginId,
            password: password
        });
        const response = http.post(`${USER_BASE_URL}/auth/login`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const authData = response.json();
        const accessToken = authData.data.accessToken;
        // console.log(`Login ID: ${loginId}, Access Token: ${accessToken}`);
        tokens.push(accessToken);
    }

    return tokens;
}


function getUserCourses() {
    const response = http.get(`${USER_COURSE_URL}`, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    });
    // const response = http.get("https://www.google.com")
    const checkResult = check(response, {
        'GetUserCourses Status is 200': (r) => r.status === 200,
    });

    if (!checkResult) {
        console.log("User Courses failed. Status: ", response.status);
    }
    //
    // const json = response.json();
    // check(json, {
    //     'GetUserCourses result is success': (j) => j.success === true,
    //     'course count is greater than 0': (j) => j.data.length > 0,
    // });
    //
    // if (json.data) {
    //     return json.data;
    // } else {
    //     return null;
    // }
}

function getCourseBySessionId(sessionId) {
    const response = http.get(`${COURSE_BY_SESSION_URL}?sortBy=priorityLevel&order=ASC&includeOfferDiscount=true&sessionId=${sessionId}`);
    check(response, {
        'GetCourseBySessionId Status is 200': (r) => r.status === 200,
    });
    const checkStatus = check(response, {
        'Valid body': (r) => r.body.length > 0
    });

    try {
        const json = response.json();
        if (checkStatus) {
            check(json, {
                'GetCourseBySessionId result is success': (j) => j.success === true,
                'course count is greater than 0': (j) => j.data.length > 0,
            });
        }

    } catch (e) {
        console.error(e);
    }
}

function getProfile(token) {
    const response = http.get(PROFILE_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const checkResult = check(response, {
        'GetProfile Status is 200': (r) => r.status === 200,
    });
    if (!checkResult) {
        console.log(response.status);
        return null;
    }

    const profileData = response.json();
    console.log("\x1b[32mAttending exam as:...........................", profileData.data.name)
    return profileData.data.id;
}

function getSessions() {
    const response = http.get(ALL_SESSIONS_URL);
    check(response, {
        'GetSessions Status is 200': (r) => r.status === 200,
    });
    if (!response) {
        return null;
    }
    const json = response.json();
    check(json, {
        'GetSessions result is success': (j) => j.success === true,
        'session count is greater than 0': (j) => j.data.length > 0,
    });
    return json.data;
}

function startExam(accessToken, logResult) {
    const params = {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };
    // Fetch a question set list
    const questionSetsResponse = http.get(`${QUESTION_SET_URL}?answerEvaluationIdRequired=true&courseId=0b94c694-9592-4cd1-8bef-7d9b7d578ed7&syllabusIds=44220c41-6ed1-4801-bcfa-595ae3a4357e&pageNumber=0&pageSize=100`, params);

    const questionSetsCheckResult = check(questionSetsResponse, {
        'Get All Question Sets Status is 200': (r) => r.status === 200,
    })

    if (!questionSetsCheckResult) {
        console.log("FAILURE: Question Set Get All Failed with Status: ", questionSetsResponse.status);
        return;
    }

    // Fetch question set details
    const questionSetDetailsResponse = http.get(`${QUESTION_SET_URL}/680d7887-5ca9-45e9-9842-35deea7b3140`, params);

    const questionSetDetailsCheckResult = check(questionSetDetailsResponse, {
        'Get Question Set Details Status is 200': (r) => r.status === 200,
    })

    if (!questionSetDetailsCheckResult) {
        console.log("FAILURE: Question Set Details Get Failed with Status: ", questionSetDetailsResponse.status);
        return;
    }

    const questionSetDetails = questionSetDetailsResponse.json();
    const questionsData = questionSetDetails.data;
    const answerData = generateMCQAnswers(questionsData);

    // start the exam
    const examStartPayload = JSON.stringify({
        answerDetails: [],
        contentType: "MCQ",
        questionSetId: "680d7887-5ca9-45e9-9842-35deea7b3140",
    });
    const examStartResponse = http.post(`${QUESTION_EXAM_BASE_URL}/exams`, examStartPayload, params);

    const examStartCheckResult = check(examStartResponse, {
        'Exam Start Status is 201': (r) => r.status === 201,
    })

    if (!examStartCheckResult) {
        console.log("FAILURE: Exam Start Failed with Status: ", examStartResponse.status);
        if (examStartResponse.body) {
            console.log(examStartResponse.json());
        }
    }

    const examStartData = examStartResponse.json();
    const examId = examStartData.data.id;

    const examSubmissionPayload = JSON.stringify(answerData);
    const examSubmissionResponse = http.put(`${QUESTION_EXAM_BASE_URL}/exams/${examId}`, examSubmissionPayload, params);

    const examSubmissionCheckResult = check(examSubmissionResponse, {
        'Exam Submission Status is 200': (r) => r.status === 200,
    });

    if (!examSubmissionCheckResult) {
        console.log("FAILURE: Exam Submission Failed with Status: ", examSubmissionResponse.status);
        return;
    }

    // call the evaluate api
    const evaluateApiResponse = http.get(`${QUESTION_EXAM_BASE_URL}/exams/evaluate/${examId}`, params);

    const evaluateCheckResult = check(evaluateApiResponse, {
        'Evaluate Exam Status is 200': (r) => r.status === 200,
    });

    if (!evaluateCheckResult) {
        console.log("FAILURE: Evaluate Exam Failed with Status: ", evaluateApiResponse.status);
    }

    if (!logResult) {
        return;
    }

    const evaluationResult = evaluateApiResponse.json();
    const correctAns = evaluationResult.data.correctAnswer;
    const totalMarks = evaluationResult.data.totalMarks;
    const negativeMarks = evaluationResult.data.negativeMarks;
    const achievedMarks = evaluationResult.data.achievedMarks;
    const takenTime = evaluationResult.data.takenTime;

    // Log the result with colorful text
    console.log("█ Exam Result \n") // title with bigger font
    console.log(`   \x1b[32mCorrect Answer................................. ${correctAns}\x1b[0m`);
    console.log(`   \x1b[32mTotal Marks.................................... ${totalMarks}\x1b[0m`);
    console.log(`   \x1b[32mNegative Marks................................. ${negativeMarks}\x1b[0m`);
    console.log(`   \x1b[32mAchieved Marks................................. ${achievedMarks}\x1b[0m`);
    console.log(`   \x1b[32mTaken Time..................................... ${takenTime}\x1b[0m`);

}

function generateMCQAnswers(mcqData) {
    // Create the base answer structure
    const answerSubmission = {
        questionSetId: mcqData.id,
        contentType: "MCQ",
        answerDetails: []
    };

    // Process each question in the exam
    mcqData.questions.forEach(question => {
        // Get all the question detail IDs for this question
        const allQuestionDetailIds = question.questionDetails.map(detail => detail.id);

        // select one answer randomly
        const selectedAnswer = allQuestionDetailIds[Math.floor(Math.random() * allQuestionDetailIds.length)];

        // Create the answer detail for this question
        const answerDetail = {
            questionId: question.id,
            writtenQuestionId: null, // Since this is for MCQs, not written questions
            answerText: "", // Optional text answer, not typically used for MCQs
            imageUrl: "", // Optional image URL
            givenQuestionDetailIds: allQuestionDetailIds,
            markedQuestionDetailIds: [selectedAnswer]
        };

        // Add this answer to the submission
        answerSubmission.answerDetails.push(answerDetail);
    });

    return answerSubmission;
}
