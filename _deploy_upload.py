import paramiko

HOST = "47.82.110.174"
PORT = 22
USER = "root"
PASSWORD = "8*gQBhEuV*Dm9z."

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(
    HOST,
    port=PORT,
    username=USER,
    password=PASSWORD,
    timeout=25,
    allow_agent=False,
    look_for_keys=False,
)

sftp = client.open_sftp()
sftp.put("_deploy_server.sh", "/root/deploy.sh")
sftp.close()

stdin, stdout, stderr = client.exec_command(
    "nohup bash /root/deploy.sh > /root/deploy.log 2>&1 & echo STARTED", timeout=30
)
print(stdout.read().decode("utf-8", "replace"), end="")
print(stderr.read().decode("utf-8", "replace"), end="")
client.close()
