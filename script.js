document.addEventListener('DOMContentLoaded', function() {
    // Simple whitelist for teachers and students with their passwords
    const whitelist = {
        'teacher1@example.com': { role: 'teacher', password: 'teacherPass1' },
        'teacher2@example.com': { role: 'teacher', password: 'teacherPass2' },
        'student1@example.com': { role: 'student', password: 'studentPass1' },
        'student2@example.com': { role: 'student', password: 'studentPass2' }
    };

    // Function to generate unique task IDs
    function generateTaskId() {
        return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            // Check if the email exists in the whitelist
            const user = whitelist[email];

            if (user && user.password === password) {
                // Save current user info in localStorage
                localStorage.setItem('currentUser', JSON.stringify({ email, role: user.role }));
                alert('Login successful!');
                window.location.href = 'dashboard.html'; // Redirect to the dashboard
            } else {
                alert('Invalid credentials, please try again.');
            }
        });
    }

    // Add a new task (only for teachers)
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const taskText = document.getElementById('taskText').value.trim();
            const taskDeadline = document.getElementById('taskDeadline').value; // Get deadline
            if (!taskText || !taskDeadline) return;

            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const newTask = {
                id: generateTaskId(),
                text: taskText,
                timestamp: Date.now(), // Capture the creation time
                deadline: new Date(taskDeadline).getTime() // Store deadline as a timestamp
            };
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            loadTasksForTeacher();
        });
    }

    // Load tasks for teachers
    function loadTasksForTeacher() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const tasksContainer = document.getElementById('tasksContainer');
        if (!tasksContainer) return; // Exit if tasksContainer doesn't exist

        tasksContainer.innerHTML = ''; // Clear the container

        // Display tasks
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');

            // Format the timestamp and deadline
            const formattedDate = new Date(task.timestamp).toLocaleString();
            const deadlineDate = new Date(task.deadline).toLocaleDateString();

            taskElement.innerHTML = `
                <p><strong>Task:</strong> ${task.text}</p>
                <p><strong>Published On:</strong> ${formattedDate}</p>
                <p><strong>Deadline:</strong> ${deadlineDate}</p>
            `;

            const taskId = task.id;

            // Add delete and update buttons for teacher
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            deleteButton.onclick = function() {
                deleteTask(taskId); // Use taskId
            };

            const updateButton = document.createElement('button');
            updateButton.textContent = 'Update';
            updateButton.className = 'update-button';
            updateButton.onclick = function() {
                updateTask(taskId); // Use taskId
            };

            taskElement.appendChild(deleteButton);
            taskElement.appendChild(updateButton);
            tasksContainer.appendChild(taskElement);
        });

        // If no tasks exist, display a message
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p>No tasks available</p>';
        }
    }

    // Load tasks for students
    function loadTasksForStudent(email) {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const submittedHomework = JSON.parse(localStorage.getItem('submittedHomework')) || {};
        const tasksContainer = document.getElementById('tasksContainer');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';  // Clear the container

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');

            // Format the timestamp and deadline
            const formattedDate = new Date(task.timestamp).toLocaleString();
            const deadlineDate = new Date(task.deadline).toLocaleDateString();
            const currentDate = new Date();
            const deadlineDateTime = new Date(task.deadline); // Deadline as a Date object

            taskElement.innerHTML = `
                <p><strong>Task:</strong> ${task.text}</p>
                <p><strong>Published On:</strong> ${formattedDate}</p>
                <p><strong>Deadline:</strong> ${deadlineDate}</p>
            `;

            const taskId = task.id;

            // Check if homework has been submitted and if so, check its status
            let homeworkStatus = undefined;
            if (submittedHomework[email] && submittedHomework[email][taskId]) {
                homeworkStatus = submittedHomework[email][taskId].status;
            }

            const submitButton = document.createElement('button');

            // Check if the current date is past the deadline
            if (currentDate > deadlineDateTime) {
                submitButton.textContent = 'Deadline Passed';
                submitButton.disabled = true; // Disable button as the deadline has passed
                submitButton.classList.add('rejected-button');
            } else if (homeworkStatus === 'accepted') {
                submitButton.textContent = 'Completed';
                submitButton.disabled = true; // Already completed
                submitButton.classList.add('accepted-button');
            } else if (homeworkStatus === 'rejected') {
                submitButton.textContent = 'Rejected';
                submitButton.classList.add('rejected-button');
                submitButton.onclick = function() {
                    window.location.href = `submitwork.html?task=${taskId}`; // Use taskId
                };
            } else if (homeworkStatus === 'submitted') {
                submitButton.textContent = 'Pending Review';
                submitButton.disabled = true; // Submitted but not yet reviewed
                submitButton.classList.add('pending-button');
            } else {
                submitButton.textContent = 'Submit Homework';
                submitButton.classList.add('submit-button');
                submitButton.onclick = function() {
                    window.location.href = `submitwork.html?task=${taskId}`; // Use taskId
                };
            }

            taskElement.appendChild(submitButton);
            tasksContainer.appendChild(taskElement);
        });
    }

    // Function to delete a task
    function deleteTask(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Also delete related submissions
        deleteSubmissionsForTask(taskId);

        loadTasksForTeacher(); // Reload tasks for teacher
    }

    // Function to delete submissions related to a task
    function deleteSubmissionsForTask(taskId) {
        let submittedHomework = JSON.parse(localStorage.getItem('submittedHomework')) || {};
        for (const email in submittedHomework) {
            if (submittedHomework[email][taskId]) {
                delete submittedHomework[email][taskId];
            }
        }
        localStorage.setItem('submittedHomework', JSON.stringify(submittedHomework));
    }

    // Function to update a task
    function updateTask(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        const newTaskText = prompt('Update the task:', tasks[taskIndex].text);
        if (newTaskText !== null && newTaskText.trim() !== '') {
            tasks[taskIndex].text = newTaskText.trim();
            localStorage.setItem('tasks', JSON.stringify(tasks));
            loadTasksForTeacher(); // Reload tasks for teacher
        }
    }

    // Load discussions with delete option for teachers
    function loadDiscussions() {
        const discussions = JSON.parse(localStorage.getItem('discussions')) || [];
        const discussionsContainer = document.getElementById('discussionsContainer');
        if (!discussionsContainer) return; // Exit if no discussionsContainer

        discussionsContainer.innerHTML = ''; // Clear existing content

        discussions.forEach((discussion, index) => {
            const discussionElement = document.createElement('p');
            discussionElement.textContent = discussion;

            // If the current user is a teacher, add a delete button
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.role === 'teacher') {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-button'; // Apply the specific style class
                deleteButton.onclick = function() {
                    deleteDiscussion(index);
                };
                discussionElement.appendChild(deleteButton);
            }

            discussionsContainer.appendChild(discussionElement);
        });
    }

    // Function to delete a discussion
    function deleteDiscussion(index) {
        let discussions = JSON.parse(localStorage.getItem('discussions')) || [];
        discussions.splice(index, 1); // Remove the discussion at the specified index
        localStorage.setItem('discussions', JSON.stringify(discussions));
        loadDiscussions(); // Reload discussions to reflect changes
    }

    // Post a new discussion
    const discussionForm = document.getElementById('discussionForm');
    if (discussionForm) {
        discussionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const discussionText = document.getElementById('discussionText').value.trim();
            if (!discussionText) return;

            let discussions = JSON.parse(localStorage.getItem('discussions')) || [];
            discussions.push(discussionText);
            localStorage.setItem('discussions', JSON.stringify(discussions));
            loadDiscussions();
        });
    }

    // Logout logic for other pages (e.g., dashboard.html)
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('currentUser'); // Clear the current user from localStorage
            alert('You have been logged out.');
            window.location.href = 'login.html'; // Redirect to the login page
        });
    }

    // Initial load of discussions and tasks when the page is loaded
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (document.getElementById('tasksContainer')) {
            if (currentUser.role === 'teacher') {
                loadTasksForTeacher();
            } else {
                loadTasksForStudent(currentUser.email);
            }
        }
        if (document.getElementById('discussionsContainer')) {
            loadDiscussions();
        }
    }
});