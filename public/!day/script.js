function get_last(){
    fetch('/last-time')
        .then(response => response.json())
        .then(data => {
            const lastTimeElement = document.getElementById('last-time');
            const last = new Date(data.last_time);
            console.log(`Last time: ${last}`);
            const current = new Date();
            console.log(`Current time: ${current}`);
            const _MS_PER_DAY = 1000 * 60 * 60 * 24;
            const utc1 = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
            const utc2 = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
            const downtime = Math.floor((utc2 - utc1) / _MS_PER_DAY);
            lastTimeElement.innerHTML = downtime;
        })
        .catch(error => console.error('Error fetching last time:', error));
}

get_last();