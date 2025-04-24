import http from 'k6/http';
import {check} from 'k6';

const UTILITY_BASE_URL = 'https://test.utkorsho.org/utility-service/api/v1';
const COURSE_BASE_URL = 'https://test.utkorsho.org/course-service/api/v1';
const USER_BASE_URL = 'https://test.utkorsho.org/user-service';
const PROFILE_URL = `${USER_BASE_URL}/api/v1/users/logged-in-user-info`
const USER_COURSE_URL = `${COURSE_BASE_URL}/user-courses`;
const COURSE_BY_SESSION_URL = `${COURSE_BASE_URL}/courses/by-session`;
const ALL_SESSIONS_URL = `${UTILITY_BASE_URL}/sessions`
const ACCESS_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJ0eXBlIjoiQUNDRVNTX1RPS0VOIiwic2siOiI2MTNiMDA0NjcwNWY1YjcwNDBjMDcwOWUwMjcwZDMyZDZhYmY2ZTU1Iiwic3ViIjoiNmQxZTQ2ZWItNjU0My00Yzk5LWFlN2EtYjc5ZGU4OTBlYTg5IiwiaWF0IjoxNzQ1NDczMjE4LCJleHAiOjE3NDU0NzY4MTh9.GZK1SwP9Su2hu2_RWPnOqrjUWnA5jPXLtDSxBX1X2EU86zv4tar3oL3S6bXhnP0a';


class ErrorHandler {
    // Instruct the error handler how to log errors
    constructor(logErrorDetails) {
        this.logErrorDetails = logErrorDetails;
    }

    // Logs response error details if isError is true.
    logError(isError, res, tags = {}) {
        if (!isError) return;

        // the Traceparent header is a W3C Trace Context
        const traceparentHeader = res.request.headers['Traceparent'];

        // Add any other useful information
        const errorData = Object.assign(
            {
                url: res.url,
                status: res.status,
                error_code: res.error_code,
                traceparent: traceparentHeader && traceparentHeader.toString(),
            },
            tags
        );
        this.logErrorDetails(errorData);
    }
}

const errorHandler = new ErrorHandler((error) => {
    console.error(error);
});

// export const options = {
//     iterations: 1
// };
//
export let options = {
    stages: [
        {duration: '30s', target: 500},
        {duration: '30s', target: 1000},
        {duration: '30s', target: 2000},
        // { duration: '2m', target: 2000 },
        // { duration: '2m', target: 2500 },
        // { duration: '2m', target: 3000 },
        {duration: '30s', target: 0},
    ],
    thresholds: {
        http_req_duration: ['p(95)<500']           // <1% errors allowed
    },
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
};

export default function () {
    // const profile = getProfile();
    //
    // if (!profile) {
    //     return;
    // }

    // const sessions = getSessions();

    // if (!sessions) {
    //     return;
    // }
    // // extract the ids from the session array
    // const sessionIds = sessions.map(session => session.id);
    // // make a request to get courses by each session
    // sessionIds.forEach(getCourseBySessionId);
    //
    getUserCourses();
}

function getUserCourses() {
    const response = http.get(`${USER_COURSE_URL}`, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    });
    const checkResult = check(response, {
        'GetUserCourses Status is 200': (r) => r.status === 200,
    });

    if (!checkResult) {
        console.log("User Courses failed. Status: ", response.status);
        console.log("Error: ", response)
    }

    const json = response.json();
    check(json, {
        'GetUserCourses result is success': (j) => j.success === true,
        'course count is greater than 0': (j) => j.data.length > 0,
    });

    if (json.data) {
        return json.data;
    } else {
        return null;
    }
}

function getCourseBySessionId(sessionId) {
    const response = http.get(`${COURSE_BY_SESSION_URL}?sortBy=priorityLevel&order=ASC&includeOfferDiscount=true&sessionId=${sessionId}`);
    check(response, {
        'GetCourseBySessionId Status is 200': (r) => r.status === 200,
    });
    const checkStatus = check(response, {
        'Valid body': (r) => r.body.length > 0
    });

    errorHandler.logError(!checkStatus, response);

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

function getProfile() {
    const response = http.get(PROFILE_URL, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    });

    check(response, {
        'GetProfile Status is 200': (r) => r.status === 200,
    });

    if (response.status === 200) {
        return response.json();
    } else {
        return null;
    }
}

function getSessions() {
    const response = http.get(ALL_SESSIONS_URL);
    check(response, {
        'GetSessions Status is 200': (r) => r.status === 200,
    });
    const json = response.json();
    check(json, {
        'GetSessions result is success': (j) => j.success === true,
        'session count is greater than 0': (j) => j.data.length > 0,
    });
    return json.data;
}