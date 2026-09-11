/* =====================================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   DATABASE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ===================================================== */

const STORAGE_KEY =
    "berry_food_tracker_user";


let appData =
    JSON.parse(
        localStorage.getItem(
            STORAGE_KEY
        )
    ) || {

        onboardingComplete: false,

        profile: {
            name: "",
            age: "",
            gender: "",
            height: "",
            weight: "",
            activity: "",
            goal: "",
            diet: "",
            allergies: ""
        },

        goals: {
            calories: 2100,
            protein: 140,
            carbs: 210,
            fat: 65,
            fiber: 30,
            water: 2500
        },

        meals: [],

        water: 0
    };


/* =====================================================
   ONBOARDING QUESTIONS
===================================================== */

const questions = [

    {
        title: "What should we call you?",
        subtitle: "Your name helps Berry personalize your experience.",
        key: "name",
        type: "text",
        placeholder: "Enter your name"
    },

    {
        title: "How old are you?",
        subtitle: "This helps estimate your daily nutrition needs.",
        key: "age",
        type: "number",
        placeholder: "Age"
    },

    {
        title: "What is your gender?",
        subtitle: "Used only for nutrition calculations.",
        key: "gender",
        type: "select",
        options: [
            "Male",
            "Female",
            "Prefer not to say"
        ]
    },

    {
        title: "What is your height?",
        subtitle: "Enter your height in centimeters.",
        key: "height",
        type: "number",
        placeholder: "Height in cm"
    },

    {
        title: "What is your current weight?",
        subtitle: "Enter your weight in kilograms.",
        key: "weight",
        type: "number",
        placeholder: "Weight in kg"
    },

    {
        title: "How active are you?",
        subtitle: "Choose the option that best matches your normal day.",
        key: "activity",
        type: "select",
        options: [
            "Sedentary",
            "Lightly active",
            "Moderately active",
            "Very active",
            "Athlete"
        ]
    },

    {
        title: "What is your main goal?",
        subtitle: "Berry will use this to create your nutrition targets.",
        key: "goal",
        type: "select",
        options: [
            "Lose weight",
            "Maintain weight",
            "Build muscle",
            "Gain weight",
            "Improve overall nutrition"
        ]
    },

    {
        title: "What type of diet do you follow?",
        subtitle: "You can change this later.",
        key: "diet",
        type: "select",
        options: [
            "No specific diet",
            "Vegetarian",
            "Vegan",
            "High protein",
            "Low carb",
            "Keto"
        ]
    }

];


let currentQuestion = 0;

/* Real Berry AI backend. Keep the Groq key on the backend only. */
const BERRY_API_URL =
    window.BERRY_API_URL ||
    "https://berry-food-tracker.vercel.app";

let selectedFoodFile = null;
let latestAIResult = null;


/* =====================================================
   ONBOARDING
===================================================== */

function renderQuestion() {

    const q =
        questions[currentQuestion];


    document.getElementById(
            "questionNumber"
        ).textContent =
        `${currentQuestion + 1} / ${questions.length}`;


    document.getElementById(
            "onboardingProgress"
        ).style.width =
        (
            (
                currentQuestion + 1
            ) /
            questions.length *
            100
        ) + "%";


    let input = "";


    if (q.type === "text") {

        input = `

            <input
                id="questionInput"
                type="text"
                placeholder="${q.placeholder}"
                value="${escapeHTML(
                    appData.profile[q.key] || ""
                )}"
                class="
                    w-full
                    mt-8
                    p-4
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-800
                "
            >

        `;

    }


    if (q.type === "number") {

        input = `

            <input
                id="questionInput"
                type="number"
                inputmode="decimal"
                placeholder="${q.placeholder}"
                value="${appData.profile[q.key] || ""}"
                class="
                    w-full
                    mt-8
                    p-4
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-800
                    text-lg
                "
            >

        `;

    }


    if (q.type === "select") {

        input = `

            <div
                class="mt-8 space-y-3"
            >

                ${q.options.map(
                    option => `

                        <button
                            onclick="
                                selectOption(
                                    '${escapeAttribute(option)}'
                                )
                            "
                            class="
                                option-button
                                w-full
                                text-left
                                p-4
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                font-semibold
                                text-slate-700
                            "
                        >
                            ${escapeHTML(option)}
                        </button>

                    `
                ).join("")}

            </div>

            <input
                id="questionInput"
                type="hidden"
                value="${escapeHTML(
                    appData.profile[q.key] || ""
                )}"
            >

        `;

    }


    document.getElementById(
        "questionContainer"
    ).innerHTML = `

        <div>

            <div
                class="
                    w-14 h-14
                    rounded-2xl
                    bg-violet-50
                    flex items-center
                    justify-center
                    text-2xl
                "
            >
                ${
                    currentQuestion === 0 ? "👋" :
                    currentQuestion === 1 ? "🎂" :
                    currentQuestion === 2 ? "🧑" :
                    currentQuestion === 3 ? "📏" :
                    currentQuestion === 4 ? "⚖️" :
                    currentQuestion === 5 ? "🏃" :
                    currentQuestion === 6 ? "🎯" :
                    "🥗"
                }
            </div>

            <h2
                class="
                    text-3xl
                    font-extrabold
                    text-slate-800
                    mt-6
                    leading-tight
                "
            >
                ${q.title}
            </h2>

            <p
                class="
                    text-sm
                    text-slate-400
                    mt-3
                    leading-6
                "
            >
                ${q.subtitle}
            </p>

            ${input}

        </div>

    `;


    document.getElementById(
        "nextButton"
    ).textContent =
        currentQuestion ===
        questions.length - 1
            ? "Create My Plan 🍓"
            : "Continue";


    if(q.type === "select"){

        highlightSelected();

    }


    lucide.createIcons();

}


function selectOption(value){

    document.getElementById(
        "questionInput"
    ).value = value;


    highlightSelected();

}


function highlightSelected(){

    const value =
        document.getElementById(
            "questionInput"
        )?.value;


    document
        .querySelectorAll(
            ".option-button"
        )
        .forEach(button => {

            if(
                button.textContent.trim()
                === value
            ){

                button.classList.add(
                    "border-violet-500",
                    "bg-violet-50",
                    "text-violet-700"
                );

            }else{

                button.classList.remove(
                    "border-violet-500",
                    "bg-violet-50",
                    "text-violet-700"
                );

            }

        });

}


function nextQuestion(){

    const q =
        questions[currentQuestion];


    const input =
        document.getElementById(
            "questionInput"
        );


    const value =
        input.value.trim();


    if(!value){

        alert(
            "Please answer this question first."
        );

        return;

    }


    appData.profile[q.key] =
        value;


    if(
        currentQuestion <
        questions.length - 1
    ){

        currentQuestion++;

        renderQuestion();

    }else{

        finishOnboarding();

    }

}


/* =====================================================
   CREATE USER PLAN
===================================================== */

function finishOnboarding(){

    /*
       These are starter calculations.

       Later this exact function can call:

       POST /api/analyze-profile

       Your backend can send the profile
       to Groq and return personalized
       calorie/macronutrient targets.
    */


    const p =
        appData.profile;


    const weight =
        Number(p.weight);


    const height =
        Number(p.height);


    const age =
        Number(p.age);


    let bmr;


    if(
        p.gender === "Female"
    ){

        bmr =
            10 * weight +
            6.25 * height -
            5 * age -
            161;

    }else{

        bmr =
            10 * weight +
            6.25 * height -
            5 * age +
            5;

    }


    const activityMultiplier = {

        "Sedentary":1.2,

        "Lightly active":1.375,

        "Moderately active":1.55,

        "Very active":1.725,

        "Athlete":1.9

    };


    let calories =
        bmr *
        (
            activityMultiplier[
                p.activity
            ] || 1.2
        );


    if(
        p.goal === "Lose weight"
    ){

        calories -= 400;

    }


    if(
        p.goal === "Build muscle"
    ){

        calories += 250;

    }


    if(
        p.goal === "Gain weight"
    ){

        calories += 350;

    }


    calories =
        Math.max(
            1200,
            Math.round(calories)
        );


    const protein =
        Math.round(
            weight *
            (
                p.goal === "Build muscle"
                    ? 2
                    : 1.6
            )
        );


    const fat =
        Math.round(
            (
                calories *
                0.25
            ) / 9
        );


    const carbs =
        Math.round(
            (
                calories -
                protein * 4 -
                fat * 9
            ) / 4
        );


    appData.goals = {

        calories,

        protein,

        carbs,

        fat,

        fiber:30,

        water:Math.round(
            weight * 35
        )

    };


    appData.onboardingComplete =
        true;


    save();


    showMainApp();

}


/* =====================================================
   SHOW APP
===================================================== */

function showMainApp(){

    document.getElementById(
        "onboarding"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "mainApp"
    ).classList.remove(
        "hidden"
    );


    render();

}


/* =====================================================
   SAVE
===================================================== */

function save(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            appData
        )
    );

}


/* =====================================================
   RENDER
===================================================== */

function render(){

    const p =
        appData.profile;


    document.getElementById(
        "welcomeName"
    ).textContent =
        p.name
            ? `Hi ${p.name} 👋`
            : "Today's Fuel";


    document.getElementById(
        "appDate"
    ).textContent =
        new Date().toLocaleDateString(
            undefined,
            {
                weekday:"long",
                month:"short",
                day:"numeric"
            }
        );


    const meals =
        todayMeals();


    const calories =
        total("calories");


    const protein =
        total("protein");


    const carbs =
        total("carbs");


    const fat =
        total("fat");


    const calorieGoal =
        appData.goals.calories;


    const remaining =
        Math.max(
            0,
            calorieGoal -
            calories
        );


    document.getElementById(
        "caloriesRemaining"
    ).textContent =
        Math.round(
            remaining
        ).toLocaleString();


    document.getElementById(
        "calorieSummary"
    ).textContent =
        `${Math.round(
            calories
        )} eaten of ${calorieGoal}`;


    const caloriePercent =
        Math.min(
            100,
            calories /
            calorieGoal *
            100
        );


    document.getElementById(
        "calorieRing"
    ).setAttribute(
        "stroke-dasharray",
        `${caloriePercent},100`
    );


    updateMacro(
        "protein",
        protein,
        appData.goals.protein
    );


    updateMacro(
        "carbs",
        carbs,
        appData.goals.carbs
    );


    updateMacro(
        "fat",
        fat,
        appData.goals.fat
    );


    document.getElementById(
        "waterAmount"
    ).textContent =
        (
            appData.water /
            1000
        ).toFixed(1);


    document.getElementById(
        "waterBar"
    ).style.width =
        Math.min(
            100,
            appData.water /
            appData.goals.water *
            100
        ) + "%";


    renderMeals();


    updateCoach(
        calories,
        protein
    );


    lucide.createIcons();

}


/* =====================================================
   MACROS
===================================================== */

function updateMacro(
    name,
    value,
    goal
){

    const p =
        Math.min(
            100,
            Math.round(
                value /
                goal *
                100
            )
        );


    document.getElementById(
        name + "Percent"
    ).textContent =
        p + "%";


    document.getElementById(
        name + "Bar"
    ).style.width =
        p + "%";


    document.getElementById(
        name + "Value"
    ).textContent =
        `${Math.round(value)} / ${goal}g`;

}


/* =====================================================
   MEALS
===================================================== */

function todayMeals(){

    return appData.meals.filter(
        meal =>
            meal.date === today()
    );

}


function total(field){

    return todayMeals().reduce(
        (
            total,
            meal
        ) =>
            total +
            Number(
                meal[field] || 0
            ),
        0
    );

}


function renderMeals(){

    const container =
        document.getElementById(
            "mealList"
        );


    const meals =
        todayMeals();


    if(!meals.length){

        container.innerHTML = `

            <div
                class="
                    bg-white/70
                    border-2
                    border-dashed
                    border-slate-200
                    rounded-2xl
                    p-5
                    text-center
                "
            >

                <div
                    class="
                        w-12 h-12
                        rounded-2xl
                        bg-slate-100
                        mx-auto
                        flex items-center
                        justify-center
                        text-xl
                    "
                >
                    🍽️
                </div>

                <p
                    class="
                        text-xs
                        text-slate-400
                        mt-3
                    "
                >
                    No meals logged today.
                </p>

                <button
                    onclick="scanFood()"
                    class="
                        mt-3
                        px-5 py-2.5
                        rounded-xl
                        bg-slate-900
                        text-white
                        text-xs
                        font-bold
                    "
                >
                    Add your first meal
                </button>

            </div>

        `;

        return;

    }


    const icons = {

        Breakfast:"sun",

        Lunch:"soup",

        Snack:"apple",

        "Pre-workout":"zap",

        "Post-workout":"glass-water",

        Dinner:"moon"

    };


    container.innerHTML =
        meals
            .slice()
            .reverse()
            .map(
                meal => `

                    <div
                        class="
                            bg-white
                            rounded-2xl
                            p-4
                            mb-3
                            border
                            border-slate-100
                            shadow-sm
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <div
                            class="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                class="
                                    w-11 h-11
                                    rounded-2xl
                                    bg-slate-50
                                    text-emerald-600
                                    flex
                                    items-center
                                    justify-center
                                "
                            >

                                <i
                                    data-lucide="${
                                        icons[
                                            meal.type
                                        ] ||
                                        "utensils"
                                    }"
                                    class="w-5 h-5"
                                ></i>

                            </div>


                            <div>

                                <div
                                    class="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <b
                                        class="
                                            text-xs
                                            text-slate-800
                                        "
                                    >
                                        ${escapeHTML(
                                            meal.type
                                        )}
                                    </b>

                                    <span
                                        class="
                                            text-[9px]
                                            px-2 py-0.5
                                            rounded-md
                                            bg-slate-100
                                            text-slate-500
                                        "
                                    >
                                        ${meal.time}
                                    </span>

                                </div>

                                <p
                                    class="
                                        text-xs
                                        text-slate-400
                                        mt-1
                                    "
                                >
                                    ${escapeHTML(
                                        meal.name
                                    )}
                                </p>

                            </div>

                        </div>


                        <div class="text-right">

                            <b
                                class="
                                    text-xs
                                    text-slate-800
                                "
                            >
                                ${Math.round(
                                    meal.calories
                                )}
                            </b>

                            <span
                                class="
                                    text-[9px]
                                    text-slate-400
                                    block
                                "
                            >
                                kcal
                            </span>

                        </div>

                    </div>

                `
            )
            .join("");


    lucide.createIcons();

}


/* =====================================================
   WATER
===================================================== */

function addWater(
    amount
){

    appData.water +=
        Number(amount);


    save();

    render();

}


/* =====================================================
   CAMERA / GALLERY
===================================================== */

function scanFood(){

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.accept =
        "image/*";


    input.capture =
        "environment";


    input.onchange =
        function(){

            if(
                input.files &&
                input.files[0]
            ){

                openFoodAnalyzer(
                    input.files[0]
                );

            }

        };


    input.click();

}


/* =====================================================
   FOOD ANALYZER
===================================================== */

function openFoodAnalyzer(
    file
){

    selectedFoodFile = file;

    const imageURL =
        URL.createObjectURL(
            file
        );


    openModal(
        "📸 Analyze Meal",
        `

            <div>

                <img
                    src="${imageURL}"
                    class="
                        w-full
                        h-52
                        object-cover
                        rounded-2xl
                        mb-4
                    "
                >


                <div
                    class="
                        bg-violet-50
                        border
                        border-violet-100
                        rounded-2xl
                        p-4
                        mb-4
                    "
                >

                    <div
                        class="
                            flex
                            items-center
                            gap-2
                            text-violet-600
                        "
                    >

                        <i
                            data-lucide="sparkles"
                            class="w-4 h-4"
                        ></i>

                        <b
                            class="text-xs"
                        >
                            Berry AI
                        </b>

                    </div>

                    <p
                        class="
                            text-xs
                            text-slate-500
                            mt-2
                            leading-5
                        "
                    >
                        AI will identify the food,
                        estimate the portion and
                        calculate calories,
                        macros and micronutrients.
                    </p>

                </div>


                <label
                    class="
                        block
                        text-xs
                        font-bold
                        text-slate-600
                    "
                >

                    Meal type

                    <select
                        id="photoMealType"
                        class="
                            w-full
                            mt-1
                            p-3
                            rounded-xl
                            border
                            border-slate-200
                        "
                    >

                        <option>
                            Breakfast
                        </option>

                        <option>
                            Lunch
                        </option>

                        <option>
                            Snack
                        </option>

                        <option>
                            Pre-workout
                        </option>

                        <option>
                            Post-workout
                        </option>

                        <option>
                            Dinner
                        </option>

                    </select>

                </label>


                <button
                    onclick="
                        analyzeFoodWithAI(
                            '${escapeAttribute(
                                file.name
                            )}'
                        )
                    "
                    class="
                        w-full
                        mt-4
                        p-4
                        rounded-2xl
                        bg-slate-900
                        text-white
                        font-extrabold
                    "
                >

                    ✨ Analyze With AI

                </button>

            </div>

        `
    );


    lucide.createIcons();

}


/* =====================================================
   AI FOOD ANALYSIS
===================================================== */

async function analyzeFoodWithAI(
    filename
){

    const type =
        document.getElementById(
            "photoMealType"
        ).value;

    if(!selectedFoodFile){

        alert(
            "Please select a food image first."
        );

        return;

    }

    closeModal();

    openModal(
        "🤖 Berry AI Analysis",
        `
            <div
                class="
                    text-center
                    py-8
                "
            >

                <div
                    class="
                        w-16 h-16
                        rounded-2xl
                        bg-violet-50
                        mx-auto
                        flex items-center
                        justify-center
                        text-3xl
                    "
                >
                    ✨
                </div>

                <h3
                    class="
                        font-extrabold
                        text-slate-800
                        mt-4
                    "
                >
                    Analyzing your meal...
                </h3>

                <p
                    class="
                        text-xs
                        text-slate-400
                        mt-2
                        leading-5
                    "
                >
                    Berry AI is identifying foods,
                    estimating portions and calculating
                    calories, macros and micronutrients.
                </p>

                <div
                    class="
                        mt-5
                        text-xs
                        text-slate-500
                    "
                >
                    ⏳ Please wait...
                </div>

            </div>
        `
    );

    try{

        const formData =
            new FormData();

        formData.append(
            "image",
            selectedFoodFile,
            selectedFoodFile.name
        );

        const response =
            await fetch(
                `${BERRY_API_URL}/api/analyze-food`,
                {
                    method:"POST",
                    body:formData
                }
            );

        const payload =
            await response.json().catch(
                () => ({})
            );

        if(!response.ok){

            throw new Error(
                payload.detail ||
                `Server error ${response.status}`
            );

        }

        if(!payload.analysis){

            throw new Error(
                "Berry AI returned no analysis."
            );

        }

        latestAIResult = payload.analysis;

        openManualFood(
            type,
            latestAIResult
        );

    }catch(error){

        console.error(
            "Berry AI error:",
            error
        );

        openModal(
            "❌ Berry AI Error",
            `
                <div class="py-4">

                    <div
                        class="
                            bg-red-50
                            border border-red-100
                            rounded-2xl
                            p-4
                            text-sm
                            text-red-700
                        "
                    >
                        <b>Food analysis failed.</b>
                        <p class="mt-2 text-xs leading-5">
                            ${escapeHTML(error.message)}
                        </p>
                    </div>

                    <div
                        class="
                            bg-amber-50
                            border border-amber-100
                            rounded-2xl
                            p-4
                            mt-3
                            text-xs
                            text-amber-700
                            leading-5
                        "
                    >
                        Make sure the Berry backend is running
                        at ${escapeHTML(BERRY_API_URL)} and that
                        your Groq API key is configured in
                        Backend/.env.
                    </div>

                    <button
                        onclick="closeModal()"
                        class="
                            w-full
                            mt-4
                            p-4
                            rounded-2xl
                            bg-slate-900
                            text-white
                            font-extrabold
                        "
                    >
                        Close
                    </button>

                </div>
            `
        );

    }

}


/* =====================================================
   MANUAL / AI RESULT
===================================================== */

function openManualFood(
    mealType="Lunch",
    aiResult=null
){

    const a =
        aiResult || {};

    const n =
        a.nutrition || {};

    const m =
        a.micronutrients || {};

    const c =
        a.confidence || {};

    const foods =
        (a.foods || []);

    const selectedType =
        mealType || "Lunch";

    const foodsHTML =
        foods.length
            ? foods.map(
                food => `
                    <div
                        class="
                            flex
                            justify-between
                            items-center
                            py-2
                            border-b
                            border-slate-100
                        "
                    >
                        <span class="text-xs text-slate-600">
                            🍽️ ${escapeHTML(food.name || "Food")}
                        </span>
                        <b class="text-xs text-slate-700">
                            ${Math.round(Number(food.estimated_grams || 0))} g
                        </b>
                    </div>
                `
            ).join("")
            : `
                <p class="text-xs text-slate-400">
                    No individual foods were returned.
                </p>
            `;

    const assumptions =
        (a.assumptions || [])
            .map(
                item =>
                    `<li>${escapeHTML(item)}</li>`
            )
            .join("");

    openModal(
        "🍽️ Nutrition Result",
        `
            <div class="space-y-3">

                <div
                    class="
                        bg-emerald-50
                        border border-emerald-100
                        p-4
                        rounded-2xl
                        text-xs
                        text-emerald-700
                    "
                >
                    🤖 <b>Berry AI nutrition result</b>
                    <br>
                    Review and edit the values before saving.
                </div>

                ${
                    a.meal_name
                    ? `
                        <div
                            class="
                                bg-white
                                rounded-2xl
                                p-4
                                border
                                border-slate-100
                            "
                        >
                            <div class="text-[10px] uppercase tracking-wide font-extrabold text-slate-400">
                                Detected meal
                            </div>
                            <div class="text-lg font-extrabold text-slate-800 mt-1">
                                ${escapeHTML(a.meal_name)}
                            </div>
                            <div class="text-xs text-slate-400 mt-1">
                                Estimated portion:
                                ${Math.round(Number(a.portion_grams || 0))} g
                            </div>
                        </div>
                    `
                    : ""
                }

                <div
                    class="
                        bg-white
                        rounded-2xl
                        p-4
                        border
                        border-slate-100
                    "
                >
                    <div class="text-xs font-extrabold text-slate-700 mb-2">
                        🔍 Foods detected
                    </div>
                    ${foodsHTML}
                </div>

                <input
                    id="foodName"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                    placeholder="Food name"
                    value="${escapeAttribute(a.meal_name || "")}" 
                >

                <select
                    id="foodType"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snack">Snack</option>
                    <option value="Pre-workout">Pre-workout</option>
                    <option value="Post-workout">Post-workout</option>
                    <option value="Dinner">Dinner</option>
                </select>

                <div
                    class="
                        bg-white
                        rounded-2xl
                        p-4
                        border
                        border-slate-100
                    "
                >
                    <div class="text-xs font-extrabold text-slate-700 mb-3">
                        📊 Macronutrients — editable
                    </div>

                    <div class="grid grid-cols-2 gap-2">

                        <label class="text-[10px] font-bold text-slate-500">
                            Calories (kcal)
                            <input
                                id="foodCalories"
                                type="number"
                                step="0.1"
                                value="${Number(n.calories_kcal || 0)}"
                                class="w-full mt-1 p-3 rounded-xl border border-slate-200"
                            >
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Protein (g)
                            <input
                                id="foodProtein"
                                type="number"
                                step="0.1"
                                value="${Number(n.protein_g || 0)}"
                                class="w-full mt-1 p-3 rounded-xl border border-slate-200"
                            >
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Carbs (g)
                            <input
                                id="foodCarbs"
                                type="number"
                                step="0.1"
                                value="${Number(n.carbohydrates_g || 0)}"
                                class="w-full mt-1 p-3 rounded-xl border border-slate-200"
                            >
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Fat (g)
                            <input
                                id="foodFat"
                                type="number"
                                step="0.1"
                                value="${Number(n.fat_g || 0)}"
                                class="w-full mt-1 p-3 rounded-xl border border-slate-200"
                            >
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Fiber (g)
                            <input
                                id="foodFiber"
                                type="number"
                                step="0.1"
                                value="${Number(n.fiber_g || 0)}"
                                class="w-full mt-1 p-3 rounded-xl border border-slate-200"
                            >
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Sugar (g)
                            <input
                                id="foodSugar"
                                type="number"
                                step="0.1"
                                value="${Number(n.sugar_g || 0)}"
                                class="w-full mt-1 p-3 rounded-xl border border-slate-200"
                            >
                        </label>

                    </div>
                </div>

                <div
                    class="
                        bg-white
                        rounded-2xl
                        p-4
                        border
                        border-slate-100
                    "
                >
                    <div class="text-xs font-extrabold text-slate-700 mb-3">
                        🧬 Micronutrients — editable
                    </div>

                    <div class="grid grid-cols-2 gap-2">

                        <label class="text-[10px] font-bold text-slate-500">
                            Sodium (mg)
                            <input id="foodSodium" type="number" step="0.1" value="${Number(m.sodium_mg || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Potassium (mg)
                            <input id="foodPotassium" type="number" step="0.1" value="${Number(m.potassium_mg || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Calcium (mg)
                            <input id="foodCalcium" type="number" step="0.1" value="${Number(m.calcium_mg || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Iron (mg)
                            <input id="foodIron" type="number" step="0.1" value="${Number(m.iron_mg || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Magnesium (mg)
                            <input id="foodMagnesium" type="number" step="0.1" value="${Number(m.magnesium_mg || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Vitamin A (µg)
                            <input id="foodVitaminA" type="number" step="0.1" value="${Number(m.vitamin_a_ug || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Vitamin C (mg)
                            <input id="foodVitaminC" type="number" step="0.1" value="${Number(m.vitamin_c_mg || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Vitamin D (µg)
                            <input id="foodVitaminD" type="number" step="0.1" value="${Number(m.vitamin_d_ug || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Vitamin B12 (µg)
                            <input id="foodB12" type="number" step="0.1" value="${Number(m.vitamin_b12_ug || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                        <label class="text-[10px] font-bold text-slate-500">
                            Folate (µg)
                            <input id="foodFolate" type="number" step="0.1" value="${Number(m.folate_ug || 0)}" class="w-full mt-1 p-3 rounded-xl border border-slate-200">
                        </label>

                    </div>
                </div>

                <div
                    class="
                        bg-amber-50
                        border border-amber-100
                        p-4
                        rounded-2xl
                        text-xs
                        text-amber-700
                        leading-5
                    "
                >
                    ⚠️ Nutrition from a photograph is an estimate.
                    Hidden oil, sauces, ingredients and exact portion size
                    can change the real values.
                    ${
                        c.food_identification !== undefined
                        ? `<br><br><b>Confidence:</b> Food ${Math.round(Number(c.food_identification || 0)*100)}% · Portion ${Math.round(Number(c.portion_estimation || 0)*100)}% · Nutrition ${Math.round(Number(c.nutrition_estimation || 0)*100)}%`
                        : ""
                    }
                </div>

                ${
                    assumptions
                    ? `
                        <div
                            class="
                                bg-slate-50
                                rounded-2xl
                                p-4
                                text-xs
                                text-slate-500
                            "
                        >
                            <b class="text-slate-700">
                                📝 AI assumptions
                            </b>
                            <ul class="mt-2 pl-5 list-disc leading-5">
                                ${assumptions}
                            </ul>
                        </div>
                    `
                    : ""
                }

                <button
                    onclick="saveFood()"
                    class="
                        w-full
                        p-4
                        rounded-2xl
                        bg-slate-900
                        text-white
                        font-extrabold
                    "
                >
                    💾 Save Meal
                </button>

            </div>
        `
    );

    document.getElementById(
        "foodType"
    ).value = selectedType;
}


/* =====================================================
   SAVE FOOD
===================================================== */

function saveFood(){

    const name =
        document.getElementById(
            "foodName"
        ).value.trim();

    if(!name){

        alert(
            "Enter the food name."
        );

        return;

    }

    const mealType =
        document.getElementById(
            "foodType"
        ).value;

    const meal = {

        id:Date.now(),

        date:today(),

        time:
            new Date()
                .toLocaleTimeString(
                    [],
                    {
                        hour:"numeric",
                        minute:"2-digit"
                    }
                ),

        name,

        type:mealType,

        calories:
            Number(
                document.getElementById(
                    "foodCalories"
                ).value
            ) || 0,

        protein:
            Number(
                document.getElementById(
                    "foodProtein"
                ).value
            ) || 0,

        carbs:
            Number(
                document.getElementById(
                    "foodCarbs"
                ).value
            ) || 0,

        fat:
            Number(
                document.getElementById(
                    "foodFat"
                ).value
            ) || 0,

        fiber:
            Number(
                document.getElementById(
                    "foodFiber"
                ).value
            ) || 0,

        sugar:
            Number(
                document.getElementById(
                    "foodSugar"
                )?.value
            ) || 0,

        micronutrients:{

            sodium_mg:
                Number(document.getElementById("foodSodium")?.value) || 0,

            potassium_mg:
                Number(document.getElementById("foodPotassium")?.value) || 0,

            calcium_mg:
                Number(document.getElementById("foodCalcium")?.value) || 0,

            iron_mg:
                Number(document.getElementById("foodIron")?.value) || 0,

            magnesium_mg:
                Number(document.getElementById("foodMagnesium")?.value) || 0,

            vitamin_a_ug:
                Number(document.getElementById("foodVitaminA")?.value) || 0,

            vitamin_c_mg:
                Number(document.getElementById("foodVitaminC")?.value) || 0,

            vitamin_d_ug:
                Number(document.getElementById("foodVitaminD")?.value) || 0,

            vitamin_b12_ug:
                Number(document.getElementById("foodB12")?.value) || 0,

            folate_ug:
                Number(document.getElementById("foodFolate")?.value) || 0
        },

        foods:
            latestAIResult?.foods || [],

        aiConfidence:
            latestAIResult?.confidence || {},

        assumptions:
            latestAIResult?.assumptions || []
    };

    appData.meals.push(
        meal
    );

    latestAIResult = null;
    selectedFoodFile = null;

    closeModal();

    save();

    render();
}


/* =====================================================
   HISTORY
===================================================== */

function openDiary(){

    const groups = {};


    appData.meals.forEach(
        meal => {

            if(
                !groups[meal.date]
            ){

                groups[meal.date] =
                    [];

            }


            groups[
                meal.date
            ].push(meal);

        }
    );


    const dates =
        Object.keys(groups)
            .sort()
            .reverse();


    let html = "";


    if(!dates.length){

        html = `

            <div
                class="
                    text-center
                    py-10
                "
            >

                <div class="text-4xl">
                    📜
                </div>

                <p
                    class="
                        text-sm
                        text-slate-400
                        mt-3
                    "
                >
                    No food history yet.
                </p>

            </div>

        `;

    }


    dates.forEach(
        date => {

            const dayMeals =
                groups[date];


            const dayCalories =
                dayMeals.reduce(
                    (
                        a,
                        m
                    ) =>
                        a +
                        Number(
                            m.calories
                        ),
                    0
                );


            html += `

                <div
                    class="
                        mb-6
                    "
                >

                    <div
                        class="
                            flex
                            justify-between
                            items-center
                        "
                    >

                        <b
                            class="
                                text-sm
                                text-slate-700
                            "
                        >
                            ${formatDate(date)}
                        </b>

                        <span
                            class="
                                text-[10px]
                                font-bold
                                text-emerald-600
                            "
                        >
                            ${Math.round(
                                dayCalories
                            )} kcal
                        </span>

                    </div>

            `;


            dayMeals.forEach(
                meal => {

                    html += `

                        <div
                            class="
                                flex
                                justify-between
                                items-center
                                py-3
                                border-b
                                border-slate-100
                            "
                        >

                            <div>

                                <b
                                    class="
                                        text-xs
                                        text-slate-700
                                    "
                                >
                                    ${escapeHTML(
                                        meal.name
                                    )}
                                </b>

                                <div
                                    class="
                                        text-[10px]
                                        text-slate-400
                                        mt-1
                                    "
                                >
                                    ${escapeHTML(
                                        meal.type
                                    )}

                                    ·

                                    ${meal.time}

                                </div>

                            </div>


                            <div
                                class="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <b
                                    class="
                                        text-xs
                                    "
                                >
                                    ${Math.round(
                                        meal.calories
                                    )}
                                    kcal
                                </b>

                                <button
                                    onclick="
                                        editMeal(
                                            ${meal.id}
                                        )
                                    "
                                    class="
                                        w-7
                                        h-7
                                        rounded-lg
                                        bg-slate-100
                                    "
                                >
                                    ✏️
                                </button>

                            </div>

                        </div>

                    `;

                }
            );


            html += `
                </div>
            `;

        }
    );


    openModal(
        "📜 Food History",
        html
    );

}


/* =====================================================
   EDIT MEAL
===================================================== */

function editMeal(
    id
){

    const meal =
        appData.meals.find(
            m => m.id === id
        );


    if(!meal) return;


    openModal(
        "✏️ Modify Meal",
        `

            <div class="space-y-3">

                <input
                    id="editName"
                    value="${escapeHTML(
                        meal.name
                    )}"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                >


                <input
                    id="editCalories"
                    type="number"
                    value="${meal.calories}"
                    placeholder="Calories"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                >


                <input
                    id="editProtein"
                    type="number"
                    value="${meal.protein}"
                    placeholder="Protein"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                >


                <input
                    id="editCarbs"
                    type="number"
                    value="${meal.carbs}"
                    placeholder="Carbs"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                >


                <input
                    id="editFat"
                    type="number"
                    value="${meal.fat}"
                    placeholder="Fat"
                    class="
                        w-full
                        p-3
                        rounded-xl
                        border
                        border-slate-200
                    "
                >


                <button
                    onclick="
                        updateMeal(
                            ${meal.id}
                        )
                    "
                    class="
                        w-full
                        p-4
                        rounded-2xl
                        bg-slate-900
                        text-white
                        font-bold
                    "
                >
                    Save Changes
                </button>


                <button
                    onclick="
                        deleteMeal(
                            ${meal.id}
                        )
                    "
                    class="
                        w-full
                        p-3
                        rounded-xl
                        bg-red-50
                        text-red-500
                        font-bold
                    "
                >
                    Delete Meal
                </button>

            </div>

        `
    );

}


function updateMeal(id){

    const meal =
        appData.meals.find(
            m => m.id === id
        );


    meal.name =
        document.getElementById(
            "editName"
        ).value;


    meal.calories =
        Number(
            document.getElementById(
                "editCalories"
            ).value
        ) || 0;


    meal.protein =
        Number(
            document.getElementById(
                "editProtein"
            ).value
        ) || 0;


    meal.carbs =
        Number(
            document.getElementById(
                "editCarbs"
            ).value
        ) || 0;


    meal.fat =
        Number(
            document.getElementById(
                "editFat"
            ).value
        ) || 0;


    closeModal();

    save();

    render();

}


function deleteMeal(id){

    if(
        !confirm(
            "Delete this meal?"
        )
    ){

        return;

    }


    appData.meals =
        appData.meals.filter(
            m => m.id !== id
        );


    closeModal();

    save();

    render();

}


/* =====================================================
   AI COACH
===================================================== */

function openAICoach(){

    const calories =
        total("calories");


    const protein =
        total("protein");


    const proteinGoal =
        appData.goals.protein;


    const proteinLeft =
        Math.max(
            0,
            proteinGoal -
            protein
        );


    let advice;


    if(
        todayMeals().length === 0
    ){

        advice =
            "Start by uploading your first meal. I'll analyze it and help you build a better day.";

    }

    else if(
        proteinLeft > 0
    ){

        advice =
            `You've logged ${Math.round(
                protein
            )}g protein. You're about ${Math.round(
                proteinLeft
            )}g away from today's target.`;

    }

    else{

        advice =
            "Nice work! You've reached your protein target. Keep your meals balanced and stay hydrated.";

    }


    openModal(
        "🤖 Berry AI Coach",
        `

            <div
                class="
                    bg-violet-50
                    rounded-2xl
                    p-5
                "
            >

                <div class="text-3xl">
                    🍓
                </div>

                <h3
                    class="
                        text-lg
                        font-extrabold
                        text-slate-800
                        mt-3
                    "
                >
                    Your daily insight
                </h3>

                <p
                    class="
                        text-sm
                        text-slate-600
                        leading-6
                        mt-3
                    "
                >
                    ${advice}
                </p>

            </div>


            <div
                class="
                    grid
                    grid-cols-2
                    gap-3
                    mt-4
                "
            >

                <div
                    class="
                        bg-slate-50
                        rounded-2xl
                        p-4
                    "
                >

                    <span
                        class="
                            text-[10px]
                            text-slate-400
                        "
                    >
                        Calories
                    </span>

                    <b
                        class="
                            block
                            text-xl
                            mt-1
                        "
                    >
                        ${Math.round(
                            calories
                        )}
                    </b>

                </div>


                <div
                    class="
                        bg-slate-50
                        rounded-2xl
                        p-4
                    "
                >

                    <span
                        class="
                            text-[10px]
                            text-slate-400
                        "
                    >
                        Protein
                    </span>

                    <b
                        class="
                            block
                            text-xl
                            mt-1
                        "
                    >
                        ${Math.round(
                            protein
                        )}g
                    </b>

                </div>

            </div>

        `
    );

}


/* =====================================================
  PROFILE
===================================================== */

function openProfile(){

    const p =
        appData.profile;


    openModal(
        "⚙️ Profile & Settings",
        `

            <div class="space-y-4">

                <div
                    class="
                        bg-violet-50
                        rounded-2xl
                        p-4
                    "
                >

                    <b
                        class="
                            text-sm
                            text-slate-800
                        "
                    >
                        ${escapeHTML(
                            p.name
                        )}
                    </b>

                    <p
                        class="
                            text-xs
                            text-slate-400
                            mt-1
                        "
                    >
                        ${p.height} cm ·
                        ${p.weight} kg ·
                        ${p.goal}
                    </p>

                </div>


                <button
                    onclick="editGoals()"
                    class="
                        w-full
                        p-4
                        rounded-2xl
                        bg-slate-50
                        text-left
                        font-bold
                        text-sm
                    "
                >
                    🎯 Modify Nutrition Goals
                </button>


                <button
                    onclick="restartOnboarding()"
                    class="
                        w-full
                        p-4
                        rounded-2xl
                        bg-slate-50
                        text-left
                        font-bold
                        text-sm
                    "
                >
                    🔄 Update My Information
                </button>

            </div>

        `
    );

}


/* =====================================================
  GOALS
===================================================== */

function editGoals(){

    openModal(
        "🎯 Modify Goals",
        `

            <div class="space-y-3">

                ${goalInput(
                    "Calories",
                    "goalCalories",
                    appData.goals.calories
                )}

                ${goalInput(
                    "Protein (g)",
                    "goalProtein",
                    appData.goals.protein
                )}

                ${goalInput(
                    "Carbs (g)",
                    "goalCarbs",
                    appData.goals.carbs
                )}

                ${goalInput(
                    "Fat (g)",
                    "goalFat",
                    appData.goals.fat
                )}

                ${goalInput(
                    "Fiber (g)",
                    "goalFiber",
                    appData.goals.fiber
                )}

                ${goalInput(
                    "Water (ml)",
                    "goalWater",
                    appData.goals.water
                )}


                <button
                    onclick="saveGoals()"
                    class="
                        w-full
                        p-4
                        rounded-2xl
                        bg-slate-900
                        text-white
                        font-bold
                    "
                >
                    Save Goals
                </button>

            </div>

        `
    );

}


function goalInput(
    label,
    id,
    value
){

    return `

        <label
            class="
                block
                text-xs
                font-bold
                text-slate-600
            "
        >

            ${label}

            <input
                id="${id}"
                type="number"
                value="${value}"
                class="
                    w-full
                    mt-1
                    p-3
                    rounded-xl
                    border
                    border-slate-200
                "
            >

        </label>

    `;

}


function saveGoals(){

    appData.goals.calories =
        Number(
            document.getElementById(
                "goalCalories"
            ).value
        );


    appData.goals.protein =
        Number(
            document.getElementById(
                "goalProtein"
            ).value
        );


    appData.goals.carbs =
        Number(
            document.getElementById(
                "goalCarbs"
            ).value
        );


    appData.goals.fat =
        Number(
            document.getElementById(
                "goalFat"
            ).value
        );


    appData.goals.fiber =
        Number(
            document.getElementById(
                "goalFiber"
            ).value
        );


    appData.goals.water =
        Number(
            document.getElementById(
                "goalWater"
            ).value
        );


    closeModal();

    save();

    render();

}


/* =====================================================
  TRENDS
===================================================== */

function openTrends(){

    const days = [];


    for(
        let i = 6;
        i >= 0;
        i--
    ){

        const date =
            new Date();


        date.setDate(
            date.getDate() - i
        );


        const key =
            date.toISOString()
                .split("T")[0];


        const calories =
            appData.meals
                .filter(
                    m =>
                        m.date === key
                )
                .reduce(
                    (
                        a,
                        m
                    ) =>
                        a +
                        Number(
                            m.calories
                        ),
                    0
                );


        days.push({

            date:key,

            label:
                date.toLocaleDateString(
                    undefined,
                    {
                        weekday:"short"
                    }
                ),

            calories

        });

    }


    const max =
        Math.max(
            appData.goals.calories,
            ...days.map(
                d => d.calories
            ),
            1
        );


    openModal(
        "📊 7 Day Trends",
        `

            <div
                class="
                    bg-slate-50
                    rounded-2xl
                    p-4
                "
            >

                <div
                    class="
                        flex
                        items-end
                        justify-between
                        h-48
                        gap-2
                    "
                >

                    ${days.map(
                        day => {

                            const height =
                                Math.max(
                                    3,
                                    (
                                        day.calories /
                                        max
                                    ) * 100
                                );


                            return `

                                <div
                                    class="
                                        flex-1
                                        h-full
                                        flex
                                        flex-col
                                        justify-end
                                        items-center
                                    "
                                >

                                    <span
                                        class="
                                            text-[8px]
                                            text-slate-400
                                            mb-1
                                        "
                                    >
                                        ${
                                            day.calories
                                                ? Math.round(
                                                    day.calories
                                                  )
                                                : ""
                                        }
                                    </span>

                                    <div
                                        class="
                                            chart-bar
                                            w-full
                                            max-w-[28px]
                                            bg-emerald-400
                                            rounded-t-lg
                                        "
                                        style="
                                            height:${height}%
                                        "
                                    ></div>

                                    <span
                                        class="
                                            text-[9px]
                                            text-slate-400
                                            mt-2
                                        "
                                    >
                                        ${day.label}
                                    </span>

                                </div>

                            `;

                        }
                    ).join("")}

                </div>

            </div>


            <div
                class="
                    mt-4
                    grid
                    grid-cols-2
                    gap-3
                "
            >

                <div
                    class="
                        bg-emerald-50
                        rounded-2xl
                        p-4
                    "
                >

                    <span
                        class="
                            text-[10px]
                            text-emerald-600
                        "
                    >
                        Goal
                    </span>

                    <b
                        class="
                            block
                            text-lg
                            mt-1
                        "
                    >
                        ${appData.goals.calories}
                        kcal
                    </b>

                </div>


                <div
                    class="
                        bg-blue-50
                        rounded-2xl
                        p-4
                    "
                >

                    <span
                        class="
                            text-[10px]
                            text-blue-600
                        "
                    >
                        Water
                    </span>

                    <b
                        class="
                            block
                            text-lg
                            mt-1
                        "
                    >
                        ${
                            (
                                appData.water /
                                1000
                            ).toFixed(1)
                        }
                        L
                    </b>

                </div>

            </div>

        `
    );

}


/* =====================================================
  RESTART PROFILE
===================================================== */

function restartOnboarding(){

    closeModal();


    appData.onboardingComplete =
        false;


    save();


    document.getElementById(
        "mainApp"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "onboarding"
    ).classList.remove(
        "hidden"
    );


    currentQuestion = 0;

    renderQuestion();

}


/* =====================================================
  MODAL
===================================================== */

function openModal(
    title,
    body
){

    document.getElementById(
        "modalTitle"
    ).textContent =
        title;


    document.getElementById(
        "modalBody"
    ).innerHTML =
        body;


    document.getElementById(
        "modal"
    ).classList.remove(
        "hidden"
    );


    lucide.createIcons();

}


function closeModal(){

    document.getElementById(
        "modal"
    ).classList.add(
        "hidden"
    );

}


/* =====================================================
  HOME
===================================================== */

function goHome(){

    closeModal();

}


/* =====================================================
  DATE
===================================================== */

function formatDate(
    date
){

    return new Date(
        date + "T12:00:00"
    ).toLocaleDateString(
        undefined,
        {
            weekday:"short",
            month:"short",
            day:"numeric"
        }
    );

}


function today(){

    return new Date()
        .toISOString()
        .split("T")[0];

}


/* =====================================================
  SECURITY
===================================================== */

function escapeHTML(
    value
){

    return String(value)
        .replace(
            /[&<>"']/g,
            char => ({

                "&":"&amp;",
                "<":"&lt;",
                ">":"&gt;",
                '"':"&quot;",
                "'":"&#039;"

            })[char]
        );

}


function escapeAttribute(
    value
){

    return String(value)
        .replace(
            /'/g,
            "\\'"
        );

}


/* =====================================================
  COACH
===================================================== */

function updateCoach(
    calories,
    protein
){

    const goal =
        appData.goals.protein;


    const remaining =
        Math.max(
            0,
            goal - protein
        );


    if(
        todayMeals().length === 0
    ){

        document.getElementById(
            "coachMessage"
        ).textContent =
            "Upload your first meal and Berry AI will analyze your nutrition.";

    }

    else if(
        remaining > 0
    ){

        document.getElementById(
            "coachMessage"
        ).textContent =
            `You need about ${Math.round(
                remaining
            )}g more protein today.`;

    }

    else{

        document.getElementById(
            "coachMessage"
        ).textContent =
            "Great! Your protein goal is on track today. 💪";

    }

}


/* =====================================================
  START APPLICATION
===================================================== */

if(
    appData.onboardingComplete
){

    showMainApp();

}else{

    renderQuestion();

}

lucide.createIcons();