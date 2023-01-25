# Apple Silicon Build

Separate builds of Arduino IDE are produced the two types of Mac CPU:

- "Intel"
- "[Apple Silicon](https://wikipedia.org/wiki/Apple_silicon#M_series)"

The Apple Silicon build must run on a Mac machine with that CPU type. [GitHub-hosted runners](https://docs.github.com/actions/using-github-hosted-runners/about-github-hosted-runners) are only available with the "Intel" CPU type so it is necessary to provide a [self-hosted runner](https://docs.github.com/actions/hosting-your-own-runners/about-self-hosted-runners) for this build.

Arduino uses an [AWS EC2](https://aws.amazon.com/ec2/) instance for this self-hosted runner.

❗ AWS does not offer a free tier for EC2 Mac instances, so charges are incurred to the AWS account for each Apple Silicon build produced via this system.

## Prerequisites

- An [AWS](https://aws.amazon.com/) account
- An application that is able to make a VNC connection to a macOS machine

## Create "Security Group"

1. Open the "**Security Groups**" page: <br />
    https://console.aws.amazon.com/ec2/home#SecurityGroups:
1. Click the "**Create security group**" button.
1. Set **Basic details > Security group name** to `github-actions-runner`
1. Set **Basic details > Description** to `For GitHub Actions runners`
1. Click the **Inbound rules > Add Rule** button.
1. Set **Inbound rules > Type** to "**SSH**".
1. Select "**Anywhere-IPv4**" from the "**Inbound rules > Source**" menu.
1. Set **Outbound rules > Type** to "**HTTPS**".
1. Click the **Outbound rules > Add Rule** button.
1. Set **Outbound rules > Type** to "**HTTP**".
1. Select "**Anywhere-IPv4**" from the "**Outbound rules > Destination**" menu.
1. Click the "**Create security group**" button.

## Create "Key Pair"

1. Open the "**Key pairs**" page: <br />
    https://console.aws.amazon.com/ec2/home#KeyPairs:
1. Click the "**Create key pair**" button.
1. Set "**Name**" to `mac2-github-actions-runner-arduino_arduino-ide`
1. Set "**Private key file format**" to "**.pem**".
1. Click the "**Create key pair**" button.
1. A file named `mac2-github-actions-runner-arduino_arduino-ide.pem` will be downloaded. Store it in a safe location.

## Create "Launch Template"

1. Open the **EC2 > Launch templates** page:
    https://console.aws.amazon.com/ec2/home?#LaunchTemplates:
1. Click the "**Create launch template**" button.
1. Set **Launch template name and description > Launch template name** to `mac2-github-actions-runner-arduino_arduino-ide`
1. Under the "**Application and OS Images (Amazon Machine Image)**" section, select the "**Quick Start**" tab.
1. Select "**macOS**" from the list of AMIs.
1. Set **Application and OS Images (Amazon Machine Image) > Architecture** to "**64-bit Mac-Arm**".
1. Set **Instance type > Instance type** to "**mac2.metal**".
1. Set **Network settings > Firewall (security groups)** to "**Select existing security group**".
1. Set **Network settings > Security groups** to "**github-actions-runner**".
1. Expand the **Network settings > Advanced network configuration** section.
1. Click the **Network settings > Advanced network configuration > Add network interface** button.
1. Set **Network settings > Advanced network configuration > Network interface 1 > Auto-assign public IP** to "**Enable**".
1. Click the **Resource tags > Add tag** button.
1. Set "**Key**" to `Name`
1. Set "**Value**" to `mac2-github-actions-runner-arduino_arduino-ide`
1. Set "**Key**" to `purpose`
1. Set "**Value**" to `GitHub Actions runner`
1. Click the **Resource tags > Add tag** button.
1. Set "**Key**" to `project`
1. Set "**Value**" to `arduino/arduino-ide`
1. Expand the "**Advanced details**" section of the settings.
1. Set **Advanced details > Tenancy** to "**Dedicated host - launch this instance on a dedicated host**".
1. Click the "**Create launch template**" on the right side of the page.

## Allocate "Dedicated Host"

---

⚠ After allocation, the host goes into [the "**available**" state](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/how-dedicated-hosts-work.html#w914aac18c17c25c23c29b9). AWS charges [by the minute the entire time the host is in this state](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-overview.html#on-demand-dedicated-hosts), which will continue (regardless of whether it is in use) until the host is [released](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-mac-instances.html#mac-instance-release-dedicated-host). You cannot release the host until [the minimum 24 hour allocation duration for Mac hosts](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-mac-instances.html#mac-instance-release-dedicated-host) has passed.

The "**Release Self-Hosted Runner Host**" workflow will automatically release the host, but if for some reason you are not able to run that workflow then you must manually release the host to avoid being charged by AWS for more than the minimum 24 hour host allocation.

---

1. Open the **EC2 > Dedicated Hosts** page: <br />
    https://console.aws.amazon.com/ec2/home?#Hosts:
1. Click the "**Allocate Dedicated Host**" button
1. Set "**Name tag**" to `mac2-github-actions-runner-arduino_arduino-ide`
1. Set "**Instance family**" to "**mac2**"
1. Uncheck the checkbox next to "**`☑` Enable**" under the ""**Support multiple instance types**" section.
1. Set "**Instance type**" to "**mac2.metal**"
1. Select the first option from the "**Availability Zone**" menu.
1. Check the checkbox next to "**☐ Enable**" under the ""**Instance auto-placement**" section.
1. Click the **Tags > Add tag** button.
1. Set "**Key**" to `purpose`
1. Set "**Value**" to `GitHub Actions runner`
1. Click the "**Allocate**" button at the bottom of the page.
1. The process may now fail with an error:
   > Your requested instance type (mac2.metal) is not supported in your requested Availability Zone ...

   If this happens, select the next option from the "**Availability Zone**" menu and click the "**Allocate**" button again. Repeat until you find the "availability zone" that works.
1. Open the **EC2 > Dedicated Hosts** page: <br />
    https://console.aws.amazon.com/ec2/home?#Hosts:
1. Under the list of hosts, click the "**Host ID**" of the host named "**mac2-github-actions-runner-arduino_arduino-ide**".
1. Add the value shown under **Dedicated Hosts details > Availability Zone** to the `env.SELF_HOSTED_RUNNER_HOST_AVAILABILITY_ZONE` key of the build GitHub Actions workflow.

## Launch "Instance"

1. Open the **EC2 > Launch templates** page:
    https://console.aws.amazon.com/ec2/home?#LaunchTemplates:
1. Click on the "**Launch template ID**" of the "**mac2-github-actions-runner-arduino-ide**" template.
1. Click the "**Actions ▼**" button.
1. Select "**Launch instance from template**" from the menu.
1. Set **Key pair (login) > Key pair name** to "**mac2-github-actions-runner-arduino_arduino-ide**".
1. Click the "**Launch instance**" button.
1. Open the "**Instances**" page:
   https://console.aws.amazon.com/ec2/home#Instances:
1. Wait until the "**Status check**" field for the instance named "**mac2-github-actions-runner-arduino_arduino-ide**" shows "**_n_/_n_ checks passed**" (e.g., "**2/2 checks passed**"). <br />
   ❗ This may take [up to 40 minutes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-mac-instances.html#mac-instance-readiness).

### Notes

- ❗ The EC2 **Actions > Monitor and troubleshoot > Get system log** feature does not work on macOS instances (the log will always be blank).
- ❗ The EC2 **Actions > Monitor and troubleshoot > Get instance screenshot** feature does not work on macOS instances (the screenshot will always be blank).

## Get Runner Registration Token

Obtain a registration token in preparation for the runner installation process described in the next section.

---

❗ This requires administrative permissions in the repository.

---

1. Open the GitHub repository in your browser.
1. Click the "**⚙ Settings**" tab.
1. Select **Actions > Runners** from the navigation panel on the left side of the page.
1. Click the "**New self-hosted runner**" button
1. Scroll down to the "**Configure**" section of the page.
1. Under this section, a `config` command is shown. Copy the token value you see in the argument to the `--token` flag of the command.

---

**ⓘ** Alternatively, you can get the token from the GitHub API:

https://docs.github.com/rest/actions/self-hosted-runners#create-a-registration-token-for-a-repository

---

## Install Runner on Instance

---

❗ The runner registration token expires after 30 minutes, so this must be completed soon after the "**Get the runner registration token**" procedure described above. If that is not possible, repeat the "**Get the runner registration token**" procedure to get a new token with another 30 minute lifetime.

---

---

❗ The computer used for these instructions must have a [VNC](https://wikipedia.org/wiki/Virtual_Network_Computing) client application installed that is able to connect to a macOS host. The built-in "Screen Sharing" feature can be used for this purpose on macOS computers.
We would expect to be able to avoid the need for VNC and perform the entire procedure using SSH, but it seems this is not possible:

https://github.com/actions/runner/issues/1959

---

1. Open the "**Instances**" page: <br />
   https://console.aws.amazon.com/ec2/home#Instances:
1. Under the list of instances, click the "**Instance ID**" of the instance named "**mac2-github-actions-runner-arduino_arduino-ide**".
1. Click the "**Connect**" button.
1. Click the "**SSH client**" tab on the "**Connect to instance**" page. <br />
   ❗ It is not possible to use the EC2 **Connect > EC2 Instance Connect** feature because it is not supported on macOS instances. You must use SSH.
1. Follow the instructions to connect to the instance machine via SSH.
1. Run the following command in the SSH terminal of the instance machine:
   ```text
   export REPO_SLUG="<repository slug>"
   ```
   ❗ Replace `<repository slug>` with the "slug" of the repository where the builds will run (e.g., `arduino/arduino-ide`).
1. Run the following command in the SSH terminal of the instance machine:
   ```text
   export RUNNER_REGISTRATION_TOKEN="<token>"
   ```
   ❗ Replace `<token>` with the token you obtained via the "**Get the runner registration token**" procedure described above.
1. Run the following command in the SSH terminal of the instance machine:
   ```text
   curl -fsSL https://raw.githubusercontent.com/arduino/arduino-ide/main/.github/assets/install-mac2-github-actions-runner.sh | sh
   ```
1. Run the following command in the SSH terminal of the instance machine:
   ```text
   sudo passwd ec2-user
   ```
1. Set a password for the `ec2-user` account and store it in a safe place.
1. Run the following command in the SSH terminal of the instance machine:
   ```text
   sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -activate -configure -access -on -restart -agent -privs -all
   ```
1. Run the following command in the SSH terminal of the instance machine to exit the SSH session:
   ```text
   exit
   ```
1. Run the following command from the terminal:
   ```text
   ssh -L 5900:localhost:5900 -i mac2-github-actions-runner-arduino_arduino-ide.pem ec2-user@<instance public DNS name>
   ```
   ❗ Replace `<instance public DNS name>` with the same name you used in the previous `ssh` command, which is also shown in the "**Public IPv4 DNS**" field of the instance's EC2 console page.
1. Open **Finder**. <br />
   **ⓘ** This and the following instructions assume you are using the "**Screen Sharing**" feature on a macOS computer. If you have a different VNC application, adapt the instructions accordingly.
1. Select **Go > Connect to Server...** from the Finder menus. <br />
   A "**Connect to Server**" dialog will open.
1. Set the "**Server Address**" field of the "**Connect to Server**" dialog to `vnc://localhost`
1. Click the "**Connect**" button. <br />
   A "**Screen Sharing requires a user name and password to sign in to "localhost"**" dialog will open. 
1. Set the "**User Name**" field of the dialog to `ec2-user`
1. Set the "**Password**" field of the dialog to the password you set previously using the `passwd` command.
1. Click the "**Sign In**" button. <br />
   A "**Screen Sharing**" window will open with the login screen of the remote instance machine.
1. Log in to the "**ec2-user**" account using the password you set previously using the `passwd` command.
1. [Open a terminal](https://support.apple.com/en-ca/guide/terminal/apd5265185d-f365-44cb-8b09-71a064a42125/mac) on the macOS host machine.
1. Run the following command in the terminal:
   ```text
   cd ~/actions-runner
   ```
1. Run the following command in the terminal:
   ```text
   ./svc.sh start
   ```
   **ⓘ** Ignore the error shown in the command output: "`Load failed: 5: Input/output error`". As long as the output contains "`Started: ...`", the process was successful.
1. Open the Apple logo menu.
1. Select "**System Settings...**" from the menu. <br />
   The "**System Settings**" window will open.
1. Select "**Users & Groups**" from the menu on the left side of the window.
1. Set **Users & Groups > Automatically log in as** to "**ec2-user**". <br />
   An authorization dialog will open.
1. Set the "**Password**" field to the password you set previously using the `passwd` command.
1. Click the "**Unlock**" button. <br />
   An additional dialog will open.
1. Set the "**Password**" field to the password you set previously using the `passwd` command.
1. Close the "**Screen Sharing**" window.
1. Run the following command in the SSH terminal of the instance machine to exit the SSH session:
   ```text
   exit
   ```
1. Open the "**Instances**" page:
   https://console.aws.amazon.com/ec2/home#Instances:
1. Under the list of instances, click the "**Instance ID**" of the instance named "**mac2-github-actions-runner-arduino_arduino-ide**".
1. Click the **Instance state ▼** button.
1. Select "**Stop instance**" from the menu. <br />
   A "**Stop instance?**" dialog will open.
1. Click the "**Stop**" button.

## Set up AWS Credentials

You must set up AWS credentials that will be used by the workflows to access EC2:

1. Open the **IAM > Policies** page: <br />
   https://console.aws.amazon.com/iamv2/home#/policies
1. Click the "**Create policy**" button.
1. Set "**Service**" to "**EC2**".
1. Search for and then check the checkbox next to each of the following actions under the "**Actions**" section:
   - **AllocateHosts**
   - **CreateTags**
   - **DescribeHosts**
   - **DescribeInstances**
   - **ReleaseHosts**
   - **StartInstances**
   - **StopInstances**
1. Check the checkbox next to "**☐ Any in this account**" for each of the following resources under the "**Resources**" section:
   - **dedicated-host**
   - **instance**
1. Click the "**Next: Tags**" button at the bottom of the page.
1. Click the "**Next: Review**" button at the bottom of the page.
1. Set "**Name**" to `github-actions`
1. Click the "**Create policy**" button at the bottom of the page.
1. Open the **IAM > User groups** page: <br />
   https://console.aws.amazon.com/iamv2/home#/groups
1. Click the "**Create group**" button.
1. Set "**User group name**" to `github-actions`
1. Check the checkbox next to the "**github-actions**" policy under the "**Attach permissions policies**" section.
1. Click the "**Create group**" button at the bottom of the page.
1. Open the **IAM > Users** page: <br />
   https://console.aws.amazon.com/iamv2/home#/users
1. Click the "**Add users**" button.
1. Set the "**User name**" field to any name you like.
1. Click the "**Next**" button at the bottom of the page.
1. Check the checkbox next to the "**github-actions**" group under the "**User groups**" section.
1. Click the "**Next**" button at the bottom of the page.
1. Click the "**Create user**" button at the bottom of the page.
1. Open the **IAM > Users** page: <br />
   https://console.aws.amazon.com/iamv2/home#/users
1. Click the "**github-actions**" link under the "**User name**" column.
1. Select the "**Security credentials**" tab.
1. Scroll down to the "**Access keys**" section.
1. Click the "**Create access key**" button.
1. Click the radio button next to "**Command Line Interface (CLI)**"
1. Check the checkbox next to "**☐ I understand the above recommendation and want to proceed to create an access key.**".
1. Click the "**Next**" button.
1. Click the "**Create access key**" button.
1. Save the "**Access key**" value in a safe place.
1. Save the "**Secret access key**" value in a safe place.
1. Open the GitHub repository in your browser.
1. Click the "**⚙ Settings**" tab.
1. Select **Secrets and variables > Actions** from the navigation panel on the left side of the page.
1. Click the "**New repository secret**" button.
1. Set the "**Name**" field to `AWS_ACCESS_KEY_ID`
1. Set the "**Secret**" field to the "**Access key**" value of the key you created.
1. Click the "**Add secret**" button.
1. Click the "**New repository secret**" button.
1. Set the "**Name**" field to `AWS_SECRET_ACCESS_KEY`
1. Set the "**Secret**" field to the "**Secret access key**" value of the key you created.
1. Click the "**Add secret**" button.

## Configure Workflows

Some additional configuration of the GitHub Actions [workflows](https://docs.github.com/actions/using-workflows/about-workflows) is needed:

1. Open the "**Zones**" tab of the **EC2 > Settings** page: <br />
   https://console.aws.amazon.com/ec2/home#Settings:tab=zones
1. Note the region ID shown in the heading of the table under "**Availability Zones**". <br />
   For example, if the heading is "**US East (Ohio) - us-east-2**", the region ID is `us-east-2`.
1. Set the `env.SELF_HOSTED_RUNNER_INSTANCE_REGION` field  to the region ID value in the "**Arduino IDE**" (`build.yml`) and "**Release Self-Hosted Runner Host**" workflows.

## Usage

### Automatic Trigger

The "**Arduino IDE**" workflow (`./github/workflows/build.yml`) is configured to automatically run the Apple Silicon build under the following conditions:

- A tag with a release format (e.g., `2.3.4`) was pushed to the repository.
- The repository has an [encrypted secret](https://docs.github.com/actions/security-guides/encrypted-secrets) named `AWS_SECRET_ACCESS_KEY`.

### Manual Trigger

Unlike the builds for the other targets, the Apple Silicon build does not run on every pull request and push to the `main` branch that modify relevant files. The reason is because this build requires access to encrypted secrets (which are not available for workflow runs triggered by a PR from a fork), and because it costs money.

It is possible for repository maintainers to manually trigger the workflow when an Apple Silicon build is wanted:

1. Open the GitHub repository in your browser.
1. Click the "**Actions**" tab.
1. Select "**Arduino IDE**" from the list of workflows on the left side of the page.
1. Click the "**Run workflow**" button.
1. Select the branch to build Arduino IDE from in the "**Use workflow from**" menu.
1. Check the checkbox next to "**☐ Build for Apple Silicon**".
1. Click the "**Run workflow**" button.

## Troubleshooting

### "Status checks" failed after starting instance

The AWS EC2 console shows the result of some reachability status checks done when the instance is started. These intermittently fail. It is not clear what the cause is, but AWS will automatically restart the instance and it should eventually achieve a successful startup.

### The "**allocate-self-hosted-runner-host**" step of the "**Arduino IDE**" workflow fails with `HostLimitExceeded` error

After the instance is stopped, a "scrubbing workflow" is performed on its dedicated host. The host remains in the "pending" state until the process is completed, which takes up to 110 minutes. During this time, instances cannot be started on the host.
