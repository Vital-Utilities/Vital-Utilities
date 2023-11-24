using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;
using VitalService.Data;
using VitalService.Data.App;
using VitalService.Dtos;
using VitalService.Dtos.Coms.Process;
using VitalService.Dtos.Coms.Profile;
using VitalService.Stores;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : Controller
    {
        public ProfileStore ProfileStore { get; }
        public ManagedProcessStore ProcessStore { get; }

        public ProfileController(ProfileStore profileStore, ManagedProcessStore affinityStore)
        {
            ProfileStore = profileStore;
            ProcessStore = affinityStore;
        }

        [ProducesResponseType(typeof(ProfileDto[]), StatusCodes.Status200OK)]
        [HttpGet("[action]")]
        public async Task<ActionResult<ProfileDto[]>> GetAll()
        {
            var result = await ProfileStore.GetAllAsync();
            return Ok(result.Select(e => e.ToDto()));
        }

        [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(int), StatusCodes.Status404NotFound)]
        [HttpGet("{id}")]
        public async Task<ActionResult<ProfileDto>> GetAsync(int id)
        {
            var result = await ProfileStore.GetAsync(id);
            if (result is null)
                return NotFound(id);
            return Ok(result.ToDto());
        }

        [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
        [HttpPut("[action]")]
        public async Task<ActionResult> Create([FromBody] CreateProfileRequest request)
        {
            var model = await ProfileStore.Create(new ProfileModel(request.Name));
            return Ok(model.ToDto());
        }

        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(int), StatusCodes.Status404NotFound)]
        [HttpPut("[action]")]
        public async Task<ActionResult> AddProcessConfig([FromBody] AddProccessRequest request)
        {
            var model = new ManagedModel(request.ProcessName, request.ExecutionPath, request.Alias, Utilities.Affinity.IntArrayToBinaryString(request.Affinity), request.ProcessPriority, request.ProfileId);
            var profile = await ProfileStore.GetAsync(request.ProfileId);
            if (profile is null)
                return NotFound(request.ProfileId);

            profile.ManagedModels.Add(model);

            await ProfileStore.UpdateAsync(profile);

            return Ok();
        }

        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(int), StatusCodes.Status404NotFound)]
        [HttpPut("[action]")]
        public async Task<ActionResult> UpdateProcessConfig([FromBody] UpdateManagedRequest request)
        {
            var profile = await ProfileStore.GetAsync(request.ManagedModelDto.ParentProfileId);
            if (profile is null)
                return NotFound(request.ManagedModelDto.ParentProfileId);

            var model = profile.ManagedModels.SingleOrDefault(e => e.Id == request.ManagedModelDto.Id);
            if (model is null)
                return NotFound(request.ManagedModelDto.Id);

            model.Alias = request.ManagedModelDto.Alias;
            model.ProcessPriority = request.ManagedModelDto.ProcessPriority;
            model.AffinityBinary = Utilities.Affinity.IntArrayToBinaryString(request.ManagedModelDto.Affinity);

            await ProfileStore.UpdateAsync(profile);

            return Ok();
        }

        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(int), StatusCodes.Status404NotFound)]
        [HttpDelete("[action]/{id}")]
        public async Task<ActionResult> DeleteProcessConfig(int id)
        {
            var model = await ProcessStore.GetAsync(id);
            if (model is null)
                return NotFound(id);

            await ProcessStore.RemoveAsync(model);

            return Ok();
        }

        [ProducesResponseType(StatusCodes.Status200OK)]
        [HttpPut("[action]")]
        public async Task<ActionResult> Update([FromBody] UpdateProfileRequest request)
        {
            var model = await request.Profile.ToModelAsync(ProcessStore);
            await ProfileStore.UpdateAsync(model);

            return Ok();
        }

        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(int), StatusCodes.Status404NotFound)]
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var model = await ProfileStore.GetAsync(id);
            if (model is null)
                return NotFound(id);

            await ProfileStore.DeleteAsync(model);
            return Ok();
        }
    }
}
