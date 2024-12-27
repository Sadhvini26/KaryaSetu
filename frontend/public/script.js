fetch('/api/jobs')
    .then(response => response.json())
    .then(data => {
        const jobList = document.getElementById('job-list');
        data.forEach(job => {
            const li = document.createElement('li');
            li.textContent = `${job.title} - ${job.description}`;
            const hireBtn = document.createElement('button');
            hireBtn.textContent = 'Hire Now';
            hireBtn.onclick = () => {
                window.location.href = `/hire?id=${job._id}`;
            };
            li.appendChild(hireBtn);
            jobList.appendChild(li);
        });
    });
