import sys
import paramiko

HOST = "47.82.110.174"
PORT = 22
USER = "root"
PASSWORD = "8*gQBhEuV*Dm9z."

cmd = sys.argv[1] if len(sys.argv) > 1 else "echo connected"

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

stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
out = stdout.read().decode("utf-8", "replace")
err = stderr.read().decode("utf-8", "replace")
exit_code = stdout.channel.recv_exit_status()

sys.stdout.write(out)
if err.strip():
    sys.stdout.write("[STDERR] " + err)
sys.stdout.write(f"\n[EXIT_CODE={exit_code}]\n")
client.close()
